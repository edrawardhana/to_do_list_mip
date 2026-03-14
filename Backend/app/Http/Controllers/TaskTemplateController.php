<?php

namespace App\Http\Controllers;

use App\Models\TaskTemplate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\AuditLog;

class TaskTemplateController extends Controller
{
    /**
     * Get templates (User/Admin gets their division's templates, Superadmin gets all)
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        
        $query = TaskTemplate::with('division');

        if ($user->role !== 'super_admin') {
            $query->where('division_id', $user->division_id);
        }

        $templates = $query->orderBy('task_name', 'asc')->get();

        return response()->json([
            'status' => 'success',
            'data' => $templates
        ]);
    }

    /**
     * Create new template (Admin/Superadmin)
     */
    public function store(Request $request)
    {
        $user = Auth::user();

        if ($user->role === 'user') {
            return response()->json(['status' => 'error', 'message' => 'Hanya Admin/Superadmin yang bisa membuat template tugas.'], 403);
        }

        $request->validate([
            'task_name' => 'required|string',
            'division_id' => $user->role === 'super_admin' ? 'required|uuid|exists:divisions,id' : 'nullable|uuid|exists:divisions,id'
        ]);

        $template = TaskTemplate::create([
            'division_id' => clone($user->role === 'super_admin' ? $request->division_id : $user->division_id),
            'task_name' => $request->task_name
        ]);

        AuditLog::record($user->id, 'Buat Template Tugas', "Membuat Template Tugas Baru: {$request->task_name}", $template->id);

        return response()->json([
            'status' => 'success',
            'message' => 'Template tugas berhasil dibuat.',
            'data' => $template
        ], 201);
    }

    /**
     * Update template
     */
    public function update(Request $request, $id)
    {
        $user = Auth::user();

        if ($user->role === 'user') {
            return response()->json(['status' => 'error', 'message' => 'Akses ditolak.'], 403);
        }

        $template = TaskTemplate::findOrFail($id);

        if ($user->role === 'admin' && $template->division_id !== $user->division_id) {
            return response()->json(['status' => 'error', 'message' => 'Tidak bisa mengubah template divisi lain.'], 403);
        }

        $request->validate([
            'task_name' => 'required|string'
        ]);

        $template->update([
            'task_name' => $request->task_name
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Template berhasil diperbarui.',
            'data' => $template
        ]);
    }

    /**
     * Delete template
     */
    public function destroy($id)
    {
        $user = Auth::user();

        if ($user->role === 'user') {
            return response()->json(['status' => 'error', 'message' => 'Akses ditolak.'], 403);
        }

        $template = TaskTemplate::findOrFail($id);

        if ($user->role === 'admin' && $template->division_id !== $user->division_id) {
            return response()->json(['status' => 'error', 'message' => 'Tidak bisa menghapus template divisi lain.'], 403);
        }

        $template->delete();

        AuditLog::record($user->id, 'Hapus Template Tugas', "Menghapus Template Tugas", $id);

        return response()->json([
            'status' => 'success',
            'message' => 'Template berhasil dihapus.'
        ]);
    }
}
