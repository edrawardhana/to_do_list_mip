<?php

namespace App\Http\Controllers;

use App\Models\Exception;
use App\Models\Notification; 
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Barryvdh\DomPDF\Facade\Pdf;
use App\Mail\SuratIzinMail;
use App\Mail\SuratIzinRejectedMail;
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

        $query = Exception::with(['user.division', 'evaluator', 'managerApproval', 'spvApproval']);

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
     * Intern submits a new exception
     */
    public function store(Request $request)
    {
        $user = Auth::user();

        $request->validate([
            'type'             => 'required|in:sakit,izin,tugas_luar,swap_shift,terlambat,pulang_awal',
            'permission_date'  => 'required|date',
            'replacement_date' => 'nullable|date',
            'description'      => 'required|string|max:1000',
            'evidence_url'     => 'nullable|file|mimes:jpeg,jpg,png,webp,pdf|max:10240',
        ]);

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
                if (env('SUPABASE_STORAGE_KEY')) {
                    $storagePath = 'exception_evidence/' . $filename . '.pdf';
                    Storage::disk('supabase')->put($storagePath, file_get_contents($file->getRealPath()));
                    $evidenceUrl = env('SUPABASE_STORAGE_URL') . '/' . env('SUPABASE_STORAGE_BUCKET', 'evidences') . '/' . $storagePath;
                } else {
                    $storagePath = $file->storeAs('exception_evidence', $filename . '.pdf', 'public');
                    $evidenceUrl = config('app.url') . Storage::url($storagePath);
                }
            } else {
                $manager = new ImageManager(new Driver());
                $image   = $manager->read(file_get_contents($file->getRealPath()));

                if ($image->width() > 1920) {
                    $image->scaleDown(width: 1920);
                }

                $encoded = $image->encode(new JpegEncoder(quality: 80));

                if (strlen((string) $encoded) > 2 * 1024 * 1024) {
                    $encoded = $image->encode(new JpegEncoder(quality: 60));
                }

                $storagePath = 'exception_evidence/' . $filename . '.jpg';
                
                if (env('SUPABASE_STORAGE_KEY')) {
                    Storage::disk('supabase')->put($storagePath, (string) $encoded);
                    $evidenceUrl = env('SUPABASE_STORAGE_URL') . '/' . env('SUPABASE_STORAGE_BUCKET', 'evidences') . '/' . $storagePath;
                } else {
                    Storage::disk('public')->put($storagePath, (string) $encoded);
                    $evidenceUrl = config('app.url') . Storage::url($storagePath);
                }
            }
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

        try {
            \DB::table('schedules') 
                ->where('user_id', $user->id)
                ->whereDate('date', $request->permission_date) 
                ->update(['status' => 'pending_' . $request->type]); 
        } catch (\Exception $e) {
            \Log::error("Gagal update Pre-Approval Visibility: " . $e->getMessage());
        }

        // 🔥 FITUR BARU: Trigger Notifikasi ke Admin Divisi
        try {
            $tanggalOff = \Carbon\Carbon::parse($request->permission_date)->format('d M Y');
            $jenisIzin = strtoupper(str_replace('_', ' ', $request->type));

            // 1. Notif ke Admin (Divisi Sama) & Super Admin (Global Semua Divisi) biar cepet di-ACC
            $evaluators = \App\Models\User::where(function ($query) use ($user) {
                    $query->where('role', 'admin')->where('division_id', $user->division_id);
                })
                ->orWhere('role', 'super_admin') // Superadmin pasti dapet
                ->get();

            foreach ($evaluators as $eval) {
                Notification::create([
                    'user_id'    => $eval->id,
                    'title'      => 'Butuh Approval ⏳',
                    'message'    => "{$user->full_name} mengajukan {$jenisIzin} untuk tanggal {$tanggalOff}. Harap segera cek Approval Center.",
                    'type'       => 'warning',
                    'is_read'    => false,
                    'created_at' => now(),
                ]);
            }

            // 2. Notif ke Intern Lain (Divisi Sama) biar tau temennya lagi ngajuin izin/sakit
            $otherInterns = \App\Models\User::where('role', 'intern')
                ->where('division_id', $user->division_id)
                ->where('id', '!=', $user->id)
                ->get();

            foreach ($otherInterns as $intern) {
                Notification::create([
                    'user_id'    => $intern->id,
                    'title'      => 'Info Rekan Divisi 📢',
                    'message'    => "{$user->full_name} sedang mengajukan {$jenisIzin} untuk tanggal {$tanggalOff} (Status: Pending).",
                    'type'       => 'info',
                    'is_read'    => false,
                    'created_at' => now(),
                ]);
            }
        } catch (\Exception $e) {
            \Log::error("Gagal mengirim Notifikasi Pending: " . $e->getMessage());
        }

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
            return response()->json(['status' => 'error', 'message' => 'Hanya Admin/Superadmin yang berhak memproses pengajuan.'], 403);
        }

        if ($exception->status === 'approved' || $exception->status === 'rejected') {
            return response()->json(['status' => 'error', 'message' => 'Pengajuan ini sudah selesai diproses.'], 422);
        }

        if ($user->role === 'admin' && $exception->manager_approved_by) {
            return response()->json(['status' => 'error', 'message' => 'Anda sudah menyetujui pengajuan ini.'], 422);
        }

        if ($user->role === 'super_admin' && $exception->spv_approved_by) {
            return response()->json(['status' => 'error', 'message' => 'Anda sudah menyetujui pengajuan ini.'], 422);
        }

        if ($user->role === 'admin') {
            $intern = $exception->user;
            if ($intern && $intern->division_id !== $user->division_id) {
                return response()->json(['status' => 'error', 'message' => 'Karyawan ini di luar divisi Anda.'], 403);
            }
        }

        $request->validate([
            'status'   => 'required|in:approved,rejected',
            'password' => $request->status === 'approved' ? 'required|string' : 'nullable|string',
        ]);

        if ($request->status === 'approved') {
            if (!Hash::check($request->password, $user->password_hash)) {
                return response()->json(['status' => 'error', 'message' => 'Konfirmasi password salah.'], 422);
            }
        }

        $updateData = [];

        if ($request->status === 'rejected') {
            $updateData['status']       = 'rejected';
            $updateData['evaluated_by'] = $user->id;
            $updateData['processed_at'] = now();
        } else {
            if ($user->role === 'admin') {
                $updateData['manager_approved_by'] = $user->id;
                $updateData['manager_approved_at'] = now();
            } elseif ($user->role === 'super_admin') {
                $updateData['spv_approved_by'] = $user->id;
                $updateData['spv_approved_at'] = now();
            }

            $managerApproved = isset($updateData['manager_approved_by']) ? $updateData['manager_approved_by'] : $exception->manager_approved_by;
            $spvApproved     = isset($updateData['spv_approved_by']) ? $updateData['spv_approved_by'] : $exception->spv_approved_by;

            if ($managerApproved && $spvApproved) {
                $updateData['status']       = 'approved';
                $updateData['evaluated_by'] = $user->id;
                $updateData['processed_at'] = now();
            } else {
                $updateData['status'] = 'pending'; 
            }
        }

        $exception->update($updateData);
        $exception->refresh();

        if ($exception->status === 'approved') {
            try {
                $this->generatePdfAndSendEmail($exception);

                // 🔥 FITUR BARU: Trigger Notif 1 (Ke Intern yang ngajuin)
                Notification::create([
                    'user_id'    => $exception->user_id,
                    'title'      => 'Izin Disetujui ✓',
                    'message'    => "Pengajuan {$exception->type} kamu telah di-ACC sepenuhnya oleh Admin. PDF Surat Izin telah dikirim ke email.",
                    'type'       => 'success',
                    'is_read'    => false,
                    'created_at' => now(),
                ]);

                // 🔥 FITUR BARU: Trigger Notif 2 (Ke semua rekan Intern se-divisi)
                $otherInterns = \App\Models\User::where('role', 'intern')
                    ->where('division_id', $exception->user->division_id)
                    ->where('id', '!=', $exception->user_id)
                    ->get();

                $tanggalOff = \Carbon\Carbon::parse($exception->permission_date)->format('d M Y');
                foreach ($otherInterns as $intern) {
                    Notification::create([
                        'user_id'    => $intern->id,
                        'title'      => 'Info Rekan Divisi',
                        'message'    => "{$exception->user->full_name} sedang {$exception->type} pada {$tanggalOff}. Harap sesuaikan back up tugas jika diperlukan.",
                        'type'       => 'info',
                        'is_read'    => false,
                        'created_at' => now(),
                    ]);
                }

            } catch (\Exception $e) {
                \Log::error('Gagal memproses Notifikasi/Email Surat Izin: ' . $e->getMessage());
            }
        }

        if ($request->status === 'rejected' && $user->role === 'super_admin') {
            try {
                $intern = $exception->user;
                Mail::to($intern->email)->send(new SuratIzinRejectedMail($exception, $intern, $user));
                
                // Trigger Notif Penolakan
                Notification::create([
                    'user_id'    => $exception->user_id,
                    'title'      => 'Izin Ditolak ❌',
                    'message'    => "Pengajuan {$exception->type} kamu ditolak oleh SPV. Silakan cek email untuk alasan detail.",
                    'type'       => 'danger',
                    'is_read'    => false,
                    'created_at' => now(),
                ]);
            } catch (\Exception $e) {
                \Log::error('Gagal mengirim email/notif penolakan Surat Izin: ' . $e->getMessage());
            }
        }

        AuditLog::record(
            $user->id,
            $user->role,
            'Proses Pengajuan (Approve/Reject)',
            $exception->fresh()->toArray(),
            $old_values,
            $exception->user_id
        );

        $message = "Pengajuan berhasil diproses.";
        if ($exception->status === 'approved') {
            $message = "Pengajuan berhasil disetujui sepenuhnya dan PDF dikirim ke email intern.";
        } elseif ($request->status === 'approved') {
            if ($user->role === 'admin') {
                $message = "Persetujuan Manager berhasil disimpan. Menunggu persetujuan SPV.";
            } else {
                $message = "Persetujuan SPV berhasil disimpan. Menunggu persetujuan Manager.";
            }
        } else {
            $message = "Pengajuan telah ditolak.";
        }

        return response()->json([
            'status'  => 'success',
            'message' => $message,
            'data'    => $exception->fresh(['user.division', 'evaluator', 'managerApproval', 'spvApproval'])
        ]);
    }

    private function getSignedUrlIfRemote($url)
    {
        if (!$url) return null;

        $baseUrl = config('filesystems.disks.supabase_avatars.url');
        if (!$baseUrl || !str_contains($url, $baseUrl)) {
            return $url;
        }

        $bucket = config('filesystems.disks.supabase_avatars.bucket', 'avatars');
        $bucketSegment = '/' . $bucket . '/';
        $pos = strpos($url, $bucketSegment);
        
        if ($pos !== false) {
            $storagePath = substr($url, $pos + strlen($bucketSegment));
            try {
                return Storage::disk('supabase_avatars')->temporaryUrl($storagePath, now()->addMinutes(10));
            } catch (\Exception $e) {
                return $url;
            }
        }

        return $url;
    }

    private function generatePdfAndSendEmail(Exception $exception)
    {
        $user = $exception->user;
        $manager = $exception->managerApproval;
        $spv = $exception->spvApproval;

        $userSignature    = $this->getSignedUrlIfRemote($user->signature_url);
        $managerSignature = $manager ? $this->getSignedUrlIfRemote($manager->signature_url) : null;
        $spvSignature     = $spv ? $this->getSignedUrlIfRemote($spv->signature_url) : null;
        $spvStamp         = $spv ? $this->getSignedUrlIfRemote($spv->stamp_url) : null;

        $pdf = Pdf::loadView('pdf.surat_izin', [
            'exception'        => $exception,
            'user'             => $user,
            'manager'          => $manager,
            'spv'              => $spv,
            'userSignature'    => $userSignature,
            'managerSignature' => $managerSignature,
            'spvSignature'     => $spvSignature,
            'spvStamp'         => $spvStamp,
        ]);
        $pdf->setOption('isRemoteEnabled', true);

        $pdfContent = $pdf->output();
        Mail::to($user->email)->send(new SuratIzinMail($exception, $user, $pdfContent));
    }

    public function resendEmail($id)
    {
        $user = Auth::user();
        if ($user->role === 'intern') {
            return response()->json(['status' => 'error', 'message' => 'Akses ditolak.'], 403);
        }

        $exception = Exception::findOrFail($id);

        if ($exception->status !== 'approved') {
            return response()->json(['status' => 'error', 'message' => 'Hanya pengajuan yang sudah disetujui yang dapat dikirim ulang.'], 422);
        }

        try {
            $this->generatePdfAndSendEmail($exception);
            return response()->json([
                'status'  => 'success',
                'message' => 'Email Surat Izin berhasil dikirim ulang!'
            ]);
        } catch (\Exception $e) {
            \Log::error('Gagal mengirim ulang email PDF Surat Izin: ' . $e->getMessage());
            return response()->json([
                'status'  => 'error',
                'message' => 'Gagal mengirim ulang email: ' . $e->getMessage()
            ], 500);
        }
    }

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

        if ($exception->evidence_url) {
            if (str_contains($exception->evidence_url, '/storage/')) {
                $path = str_replace(config('app.url') . '/storage/', '', $exception->evidence_url);
                Storage::disk('public')->delete($path);
            } else {
                $baseUrl = env('SUPABASE_STORAGE_URL');
                if ($baseUrl) {
                    $bucket = env('SUPABASE_STORAGE_BUCKET', 'evidences');
                    $oldPath = str_replace($baseUrl . '/' . $bucket . '/', '', $exception->evidence_url);
                    Storage::disk('supabase')->delete($oldPath);
                }
            }
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