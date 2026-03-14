<?php

namespace App\Http\Controllers;

use App\Models\DailyTask;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Database\QueryException;
use App\Models\AuditLog;

class DailyTaskController extends Controller
{
    /**
     * Get Logbook data with Data Isolation
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        
        $query = DailyTask::query();

        if ($user->role === 'user') {
            // User only sees their own tasks
            $query->where('user_id', $user->id);
        } elseif ($user->role === 'admin') {
            // Admin sees tasks from their entire division
            $query->where('division_id', $user->division_id);
        }
        // Superadmin sees all (no filter)

        if ($request->has('date')) {
            $query->whereDate('created_at', $request->date);
        }

        $tasks = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'status' => 'success',
            'data' => $tasks
        ]);
    }

    /**
     * Create new Task/Logbook
     */
    public function store(Request $request)
    {
        $user = Auth::user();

        // Admin/Superadmin generally don't fill out logbooks, but if they do, we allow it.
        // However, we enforce the division_id to be their own.
        $request->validate([
            'task_template_id' => 'nullable|uuid',
            'task_name' => 'required|string',
            // evidence_url usually uploaded separately to Storage, then sent here as string URL
            'evidence_url' => 'nullable|string',
            'confirmed_participants' => 'nullable|array'
        ]);

        $task = DailyTask::create([
            'user_id' => $user->id,
            'division_id' => $user->division_id,
            'task_template_id' => $request->task_template_id,
            'task_name' => $request->task_name,
            'status' => 'pending', // Default strictly lowercase pending
            'evidence_url' => $request->evidence_url,
            'confirmed_participants' => $request->confirmed_participants ?? []
        ]);

        AuditLog::record($user->id, 'Buat Logbook', "Membuat Logbook Tugas Baru: {$request->task_name}", $task->id);

        return response()->json([
            'status' => 'success',
            'message' => 'Berhasil membuat logbook tugas.',
            'data' => $task
        ], 201);
    }

    /**
     * Update logbook (User updates progress/photo, Admin approves)
     */
    public function update(Request $request, $id)
    {
        $user = Auth::user();
        $task = DailyTask::findOrFail($id);

        // Security: Ensure User only edits their own, Admin only edits their division's
        if ($user->role === 'user' && $task->user_id !== $user->id) {
            return response()->json(['status' => 'error', 'message' => 'Anda tidak bisa mengedit tugas orang lain.'], 403);
        }
        if ($user->role === 'admin' && $task->division_id !== $user->division_id) {
            return response()->json(['status' => 'error', 'message' => 'Tugas ini di luar divisi Anda.'], 403);
        }

        $request->validate([
            'task_name' => 'sometimes|string',
            'status' => 'sometimes|in:pending,approved,rejected',
            'evidence_url' => 'sometimes|string',
            'confirmed_participants' => 'sometimes|array'
        ]);

        // Non-admin shouldn't change status to approved
        if ($user->role === 'user' && $request->has('status') && $request->status !== 'pending') {
             return response()->json(['status' => 'error', 'message' => 'Hanya Admin yang berhak menyetujui logbook.'], 403);
        }

        try {
            // Only update fields that are present in the request
            $dataToUpdate = $request->only(['task_name', 'status', 'evidence_url', 'confirmed_participants']);
            $task->update($dataToUpdate);

            $actionDetail = $user->role === 'user' ? "Update progres/bukti tugas harian" : "Memproses/Update tugas milik bawahan (Status: {$task->status})";
            AuditLog::record($user->id, 'Update Logbook', $actionDetail, $task->id);

            return response()->json([
                'status' => 'success',
                'message' => 'Berhasil memperbarui logbook.',
                'data' => $task
            ]);

        } catch (QueryException $e) {
            // 🚨 CATCH THE SUPABASE TRIGGER EXCEPTION (Evidence Lock)
            // If the user tries to update an existing evidence_url, Supabase will reject it
            // and throw an error with our custom message.
            if (str_contains($e->getMessage(), 'Akses Ditolak: Bukti foto')) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Bukti foto sudah dikunci permanen oleh sistem dan tidak dapat diubah lagi. Hubungi Admin Jika ada keliruan.',
                    'system_error' => 'TRIGGER_EVIDENCE_LOCK'
                ], 403);
            }

            // Other database errors
            return response()->json([
                'status' => 'error',
                'message' => 'Terjadi kesalahan sistem database.',
                'debug' => env('APP_DEBUG') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Delete logbook (Usually Admin/Superadmin only, or User if still pending and no photo?)
     * Let's restrict it to Superadmin or Admin for now.
     */
    public function destroy($id)
    {
        $user = Auth::user();
        $task = DailyTask::findOrFail($id);

        if ($user->role === 'user') {
             return response()->json(['status' => 'error', 'message' => 'User biasa tidak diizinkan menghapus logbook permanen.'], 403);
        }

        if ($user->role === 'admin' && $task->division_id !== $user->division_id) {
            return response()->json(['status' => 'error', 'message' => 'Anda tidak bisa menghapus tugas divisi lain.'], 403);
        }

        $task->delete();

        AuditLog::record($user->id, 'Hapus Logbook', "Menghapus permanen Logbook Tugas: {$task->task_name}", $id);

        return response()->json([
            'status' => 'success',
            'message' => 'Laporan tugas berhasil dihapus.'
        ]);
    }
}
