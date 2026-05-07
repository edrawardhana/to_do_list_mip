<?php

namespace App\Http\Controllers;

use App\Models\Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use App\Models\AuditLog;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;
use Intervention\Image\Encoders\JpegEncoder;
use Intervention\Image\Encoders\WebpEncoder;

class ExceptionController extends Controller
{
    /**
     * Get list of exceptions (Sakit, Izin, Tugas Luar, Swap Shift)
     */
    public function index(Request $request)
    {
        $user = Auth::user();

        $query = Exception::with(['user', 'evaluator']);

        if ($user->role === 'intern') {
            $query->where('user_id', $user->id);
        } elseif ($user->role === 'admin') {
            $query->whereHas('user', function ($q) use ($user) {
                $q->where('division_id', $user->division_id);
            });
        }

        if ($request->has('date')) {
            $query->whereDate('permission_date', $request->date);
        }

        $exceptions = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'status' => 'success',
            'data' => $exceptions
        ]);
    }

    /**
     * Intern submits a new exception (Sakit/Izin/Tugas Luar/Swap)
     * Supports file upload for evidence (image or PDF), max 2MB after compression
     */
    public function store(Request $request)
    {
        $user = Auth::user();

        $request->validate([
            'type'             => 'required|in:sakit,izin,tugas_luar,swap_shift',
            'permission_date'  => 'required|date',
            'replacement_date' => 'nullable|date',
            'description'      => 'required|string|max:1000',
            'evidence_url'     => 'nullable|file|mimes:jpeg,jpg,png,webp,pdf|max:10240', // 10MB raw, we compress images
        ]);

        // Sakit wajib bukti
        if ($request->type === 'sakit' && !$request->hasFile('evidence_url')) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Surat keterangan sakit wajib dilampirkan.'
            ], 422);
        }

        $evidenceUrl = null;

        if ($request->hasFile('evidence_url')) {
            $file = $request->file('evidence_url');
            $mime = $file->getMimeType();
            $filename = 'exception_' . $user->id . '_' . time();

            if ($mime === 'application/pdf') {
                // PDF: simpan langsung, max 10MB (sudah divalidasi)
                $storagePath = $file->storeAs('exception_evidence', $filename . '.pdf', 'public');
            } else {
                // Image: compress dengan Intervention Image v4
                $manager = new ImageManager(new Driver());
                $image   = $manager->decode(file_get_contents($file->getRealPath()));

                // Resize jika lebar > 1920px
                if ($image->width() > 1920) {
                    $image->scaleDown(width: 1920);
                }

                // Encode ke JPEG 80% quality
                $encoded = $image->encode(new JpegEncoder(quality: 80));

                // Cek ukuran hasil kompresi — jika masih > 2MB, turunkan quality
                if (strlen((string) $encoded) > 2 * 1024 * 1024) {
                    $encoded = $image->encode(new JpegEncoder(quality: 60));
                }

                $storagePath = 'exception_evidence/' . $filename . '.jpg';
                Storage::disk('public')->put($storagePath, (string) $encoded);
            }

            $evidenceUrl = config('app.url') . Storage::url($storagePath);
        }

        $exception = Exception::create([
            'user_id'          => $user->id,
            'type'             => $request->type,
            'permission_date'  => $request->permission_date,
            'replacement_date' => $request->replacement_date,
            'description'      => $request->description,
            'evidence_url'     => $evidenceUrl,
            'status'           => 'pending',
        ]);

        AuditLog::record(
            $user->id,
            $user->role,
            'Pengajuan Pengecualian (Izin/Sakit)',
            $exception->toArray()
        );

        return response()->json([
            'status'  => 'success',
            'message' => 'Berhasil mengajukan Exception.',
            'data'    => $exception
        ], 201);
    }

    /**
     * Admin processing the exception (Approve/Reject)
     */
    public function update(Request $request, $id)
    {
        $user      = Auth::user();
        $exception = Exception::findOrFail($id);
        $old_values = $exception->toArray();

        if ($user->role === 'intern') {
            return response()->json(['status' => 'error', 'message' => 'Hanya Admin yang berhak memproses pengajuan.'], 403);
        }

        if ($user->role === 'admin') {
            $intern = $exception->user;
            if ($intern && $intern->division_id !== $user->division_id) {
                return response()->json(['status' => 'error', 'message' => 'Karyawan ini di luar divisi Anda.'], 403);
            }
        }

        $request->validate([
            'status' => 'required|in:approved,rejected',
        ]);

        $exception->update([
            'status'       => $request->status,
            'evaluated_by' => $user->id,
            'processed_at' => now(),
        ]);

        AuditLog::record(
            $user->id,
            $user->role,
            'Proses Pengajuan (Approve/Reject)',
            $exception->fresh()->toArray(),
            $old_values,
            $exception->user_id
        );

        return response()->json([
            'status'  => 'success',
            'message' => "Pengajuan berhasil di-{$request->status}.",
            'data'    => $exception
        ]);
    }

    /**
     * Delete an exception/request (only if pending, or Superadmin)
     */
    public function destroy($id)
    {
        $user      = Auth::user();
        $exception = Exception::findOrFail($id);

        if ($user->role === 'intern' && $exception->status !== 'pending') {
            return response()->json(['status' => 'error', 'message' => 'Tidak bisa membatalkan pengajuan yang sudah diproses.'], 403);
        }

        if ($user->role === 'intern' && $exception->user_id !== $user->id) {
            return response()->json(['status' => 'error', 'message' => 'Anda hanya bisa menghapus pengajuan milik sendiri.'], 403);
        }

        if ($user->role === 'admin') {
            $intern = $exception->user;
            if ($intern && $intern->division_id !== $user->division_id) {
                return response()->json(['status' => 'error', 'message' => 'Karyawan ini di luar divisi Anda.'], 403);
            }
        }

        // Hapus file dari storage jika ada
        if ($exception->evidence_url) {
            $path = str_replace(config('app.url') . '/storage/', '', $exception->evidence_url);
            Storage::disk('public')->delete($path);
        }

        $old_values = $exception->toArray();
        $targetId   = $exception->user_id;
        $exception->delete();

        AuditLog::record(
            $user->id,
            $user->role,
            'Hapus Pengajuan',
            null,
            $old_values,
            $targetId
        );

        return response()->json([
            'status'  => 'success',
            'message' => 'Data pengajuan berhasil dihapus.'
        ]);
    }
}
