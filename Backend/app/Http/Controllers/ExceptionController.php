<?php

namespace App\Http\Controllers;

use App\Models\Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\AuditLog;

class ExceptionController extends Controller
{
    /**
     * Get list of exceptions (Sakit, Izin, Tugas Luar, Swap Shift)
     */
    public function index(Request $request)
    {
        $user = Auth::user();

        // Load relasi uploader dan evaluator
        $query = Exception::with(['user', 'evaluator']);

        if ($user->role === 'intern') {
            // Intern sees only their own
            $query->where('user_id', $user->id);
        } elseif ($user->role === 'admin') {
            // Admin sees from their division
            $query->whereHas('user', function ($q) use ($user) {
                $q->where('division_id', $user->division_id);
            });
        }
        // Superadmin sees all

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
     */
    public function store(Request $request)
    {
        $user = Auth::user();

        $request->validate([
            'type' => 'required|in:sakit,izin,tugas_luar,swap_shift',
            'permission_date' => 'required|date',
            'replacement_date' => 'nullable|date',
            'description' => 'required|string',
            'evidence_url' => 'nullable|string' // usually required for sakit, handled conditionally
        ]);

        if ($request->type === 'sakit' && !$request->evidence_url) {
            return response()->json(['status' => 'error', 'message' => 'Surat keterangan sakit wajib dilampirkan.'], 400);
        }

        $exception = Exception::create([
            'user_id' => $user->id,
            'type' => $request->type,
            'permission_date' => $request->permission_date,
            'replacement_date' => $request->replacement_date,
            'description' => $request->description,
            'evidence_url' => $request->evidence_url,
            'status' => 'pending'
        ]);

        AuditLog::record(
            $user->id, 
            $user->role, 
            'Pengajuan Pengecualian (Izin/Sakit)', 
            $exception->toArray()
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Berhasil mengajukan Exception.',
            'data' => $exception
        ], 201);
    }

    /**
     * Admin processing the exception (Approve/Reject)
     */
    public function update(Request $request, $id)
    {
        $user = Auth::user();
        $exception = Exception::findOrFail($id);
        $old_values = $exception->toArray();

        if ($user->role === 'intern') {
             return response()->json(['status' => 'error', 'message' => 'Hanya Admin yang berhak memproses pengajuan.'], 403);
        }

        if ($user->role === 'admin') {
            // Ensure admin only processes from own division
            $intern = $exception->user;
            if ($intern && $intern->division_id !== $user->division_id) {
                return response()->json(['status' => 'error', 'message' => 'Karyawan ini di luar divisi Anda.'], 403);
            }
        }

        $request->validate([
            'status' => 'required|in:approved,rejected',
        ]);

        $exception->update([
            'status' => $request->status,
            'evaluated_by' => $user->id,
            'processed_at' => now()
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
            'status' => 'success',
            'message' => "Pengajuan berhasil di-{$request->status}.",
            'data' => $exception
        ]);
    }

    /**
     * Delete an exception/request (only if pending, or Superadmin)
     */
    public function destroy($id)
    {
        $user = Auth::user();
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

        $old_values = $exception->toArray();
        $targetId = $exception->user_id;

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
            'status' => 'success',
            'message' => 'Data pengajuan berhasil dihapus.'
        ]);
    }
}
