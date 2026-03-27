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
        
        $query = DailyTask::with(['taskTemplate', 'uploader', 'evaluator']);

        if ($user->role === 'intern') {
            // Intern only sees their own tasks
            $query->where('uploader_id', $user->id);
        } elseif ($user->role === 'admin') {
            // Admin sees tasks from their entire division
            $query->where('division_id', $user->division_id);
        }
        // Superadmin sees all (no filter)

        if ($request->has('date')) {
            $query->whereDate('task_date', $request->date);
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

        $request->validate([
            'template_id' => 'required|uuid',
            'task_date' => 'required|date',
            'description' => 'nullable|string',
            'evidence_url' => 'nullable|string',
            'confirmed_participants' => 'nullable|array',
            'captured_at' => 'nullable|date'
        ]);

        $task = DailyTask::create([
            'uploader_id' => $user->id,
            'division_id' => $user->division_id,
            'template_id' => $request->template_id,
            'task_date' => $request->task_date,
            'description' => $request->description,
            'status' => 'pending', 
            'evidence_url' => $request->evidence_url,
            'confirmed_participants' => $request->confirmed_participants ?? [],
            'captured_at' => $request->captured_at
        ]);

        AuditLog::record(
            $user->id, 
            $user->role, 
            'Buat Logbook', 
            $task->toArray()
        );

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
        $old_values = $task->toArray();

        // Security: Ensure User only edits their own, Admin only edits their division's
        if ($user->role === 'intern' && $task->uploader_id !== $user->id) {
            return response()->json(['status' => 'error', 'message' => 'Anda tidak bisa mengedit tugas orang lain.'], 403);
        }
        if ($user->role === 'admin' && $task->division_id !== $user->division_id) {
            return response()->json(['status' => 'error', 'message' => 'Tugas ini di luar divisi Anda.'], 403);
        }

        $request->validate([
            'description' => 'sometimes|string',
            'status' => 'sometimes|in:pending,approved,rejected,revision',
            'reject_reason' => 'nullable|string',
            'evidence_url' => 'sometimes|string',
            'confirmed_participants' => 'sometimes|array',
            'is_archived' => 'sometimes|boolean'
        ]);

        // Non-admin shouldn't change status to approved/rejected/revision
        if ($user->role === 'intern' && $request->has('status') && $request->status !== 'pending') {
             return response()->json(['status' => 'error', 'message' => 'Hanya Admin yang berhak memproses logbook.'], 403);
        }

        try {
            $dataToUpdate = $request->only(['description', 'status', 'reject_reason', 'evidence_url', 'confirmed_participants', 'is_archived']);
            
            // Mark evaluated_by if admin processed it
            if ($user->role === 'admin' || $user->role === 'super_admin') {
                if ($request->has('status')) {
                    $dataToUpdate['evaluated_by'] = $user->id;
                }
            }

            $task->update($dataToUpdate);

            AuditLog::record(
                $user->id, 
                $user->role, 
                'Update Logbook', 
                $task->fresh()->toArray(), 
                $old_values,
                $user->role !== 'intern' ? $task->uploader_id : null // Target is the intern if admin is acting
            );

            return response()->json([
                'status' => 'success',
                'message' => 'Berhasil memperbarui logbook.',
                'data' => $task
            ]);

        } catch (QueryException $e) {
            if (str_contains($e->getMessage(), 'Akses Ditolak: Bukti foto')) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Bukti foto sudah dikunci permanen oleh sistem dan tidak dapat diubah lagi. Hubungi Admin Jika ada keliruan.',
                    'system_error' => 'TRIGGER_EVIDENCE_LOCK'
                ], 403);
            }

            return response()->json([
                'status' => 'error',
                'message' => 'Terjadi kesalahan sistem database.',
                'debug' => env('APP_DEBUG') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Delete logbook
     */
    public function destroy($id)
    {
        $user = Auth::user();
        $task = DailyTask::findOrFail($id);

        if ($user->role === 'intern') {
             return response()->json(['status' => 'error', 'message' => 'Pelatih tidak diizinkan menghapus logbook permanen.'], 403);
        }

        if ($user->role === 'admin' && $task->division_id !== $user->division_id) {
            return response()->json(['status' => 'error', 'message' => 'Anda tidak bisa menghapus tugas divisi lain.'], 403);
        }

        // Simpan state sebelum dihapus untuk Audit Log
        $old_values = $task->toArray();
        $internId = $task->uploader_id;
        
        $task->delete();

        AuditLog::record(
            $user->id, 
            $user->role, 
            'Hapus Logbook', 
            null, 
            $old_values, 
            $internId
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Laporan tugas berhasil dihapus.'
        ]);
    }
}
