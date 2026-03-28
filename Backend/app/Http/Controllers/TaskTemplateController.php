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

        $templates = $query->orderBy('title', 'asc')->get();

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

        if ($user->role === 'intern') {
            return response()->json(['status' => 'error', 'message' => 'Hanya Admin/Superadmin yang bisa membuat template tugas.'], 403);
        }

        $request->validate([
            'title' => 'required|string',
            'description' => 'nullable|string',
            'division_id' => $user->role === 'super_admin' ? 'required|uuid|exists:divisions,id' : 'nullable|uuid|exists:divisions,id'
        ]);

        $template = TaskTemplate::create([
            'division_id' => $user->role === 'super_admin' ? $request->division_id : $user->division_id,
            'title' => $request->title,
            'description' => $request->description,
        ]);

        AuditLog::record($user->id, $user->role, 'Buat Template Tugas', $template->toArray());

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

        if ($user->role === 'intern') {
            return response()->json(['status' => 'error', 'message' => 'Akses ditolak.'], 403);
        }

        $template = TaskTemplate::findOrFail($id);

        if ($user->role === 'admin' && $template->division_id !== $user->division_id) {
            return response()->json(['status' => 'error', 'message' => 'Tidak bisa mengubah template divisi lain.'], 403);
        }

        $request->validate([
            'title' => 'required|string',
            'description' => 'nullable|string',
        ]);

        $template->update([
            'title' => $request->title,
            'description' => $request->description,
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

        if ($user->role === 'intern') {
            return response()->json(['status' => 'error', 'message' => 'Akses ditolak.'], 403);
        }

        $template = TaskTemplate::findOrFail($id);

        if ($user->role === 'admin' && $template->division_id !== $user->division_id) {
            return response()->json(['status' => 'error', 'message' => 'Tidak bisa menghapus template divisi lain.'], 403);
        }

        $template->delete();

        AuditLog::record($user->id, $user->role, 'Hapus Template Tugas', null, $template->toArray());

        return response()->json([
            'status' => 'success',
            'message' => 'Template berhasil dihapus.'
        ]);
    }
}
