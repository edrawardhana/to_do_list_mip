<?php

namespace App\Http\Controllers;

use App\Models\Whiteboard;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\AuditLog;

class WhiteboardController extends Controller
{
    /**
     * Get Whiteboards (Announcements).
     * Strictly isolated per division for standard users/admins.
     */
    public function index()
    {
        $user = Auth::user();

        $query = Whiteboard::query();

        if ($user->role !== 'super_admin') {
            $query->where('division_id', $user->division_id);
        }

        $whiteboards = $query->orderBy('id', 'desc')->get();

        return response()->json([
            'status' => 'success',
            'data' => $whiteboards
        ]);
    }

    /**
     * Store a new announcement (Admin/Superadmin only)
     */
    public function store(Request $request)
    {
        $user = Auth::user();

        if ($user->role === 'intern') {
             return response()->json(['status' => 'error', 'message' => 'Hanya Admin yang bisa membuat pengumuman.'], 403);
        }

        $request->validate([
            'title'       => 'required|string',
            'type'        => 'required|string', 
            'file_url'    => 'nullable|string',
            'description' => 'nullable|string',
            'file'        => 'nullable|file|mimes:pdf,mp4,webm,jpg,jpeg,png|max:10240', 
        ], [
            'file.max'   => 'Gagal! Ukuran file melebihi batas maksimal 10MB.',
            'file.mimes' => 'Format file ditolak server. Pastikan format PDF, MP4, WEBM, JPG, atau PNG.'
        ]);

        $file_url = $request->input('file_url'); 

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $filename = 'sop_' . time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs('whitebooks', $filename, 'public');
            $file_url = url('storage/' . $path);
        }

        $whiteboard = Whiteboard::create([
            'division_id' => $user->division_id,
            'title'       => $request->title,
            'file_url'    => $file_url, 
            'type'        => $request->type,
            'description' => $request->description
        ]);

        AuditLog::record(
            $user->id,
            $user->role,
            'Buat Pengumuman Whiteboard',
            $whiteboard->toArray()
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Berhasil membuat papan pengumuman.',
            'data' => $whiteboard
        ], 201);
    }

    /**
     * Update an announcement
     */
    public function update(Request $request, $id)
    {
        $user = Auth::user();
        $whiteboard = Whiteboard::findOrFail($id);

        if ($user->role === 'intern') {
            return response()->json(['status' => 'error', 'message' => 'Akses ditolak.'], 403);
        }

        if ($user->role === 'admin' && $whiteboard->division_id !== $user->division_id) {
            return response()->json(['status' => 'error', 'message' => 'Tugas ini di luar divisi Anda.'], 403);
        }

        $old_values = $whiteboard->toArray();

        $request->validate([
            'title'       => 'sometimes|string',
            'type'        => 'sometimes|string',
            'file_url'    => 'nullable|string',
            'description' => 'nullable|string',
            'file'        => 'nullable|file|mimes:pdf,mp4,webm,jpg,jpeg,png|max:10240',
        ], [
            'file.max'   => 'Gagal! Ukuran file melebihi batas maksimal 10MB.',
            'file.mimes' => 'Format file ditolak server. Pastikan format PDF, MP4, WEBM, JPG, atau PNG.'
        ]);

        $dataToUpdate = $request->only(['title', 'type', 'description']);

        if ($request->has('file_url')) {
            $dataToUpdate['file_url'] = $request->file_url;
        }

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $filename = 'sop_' . time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs('whitebooks', $filename, 'public');
            $dataToUpdate['file_url'] = url('storage/' . $path);
        }

        // 🔥 FIX 2: Pake $dataToUpdate yang udah diracik di atas!
        $whiteboard->update($dataToUpdate);

        AuditLog::record(
            $user->id,
            $user->role,
            'Update Pengumuman Whiteboard',
            $whiteboard->fresh()->toArray(),
            $old_values
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Pengumuman berhasil diperbarui.',
            'data' => $whiteboard
        ]);
    }

    /**
     * Delete an announcement
     */
    public function destroy($id)
    {
         $user = Auth::user();
         $whiteboard = Whiteboard::findOrFail($id);
 
         if ($user->role === 'intern') {
             return response()->json(['status' => 'error', 'message' => 'Akses ditolak.'], 403);
         }
 
         if ($user->role === 'admin' && $whiteboard->division_id !== $user->division_id) {
             return response()->json(['status' => 'error', 'message' => 'Anda tidak bisa menghapus pengumuman divisi lain.'], 403);
         }
 
         $whiteboard->delete();
 
         return response()->json([
             'status' => 'success',
             'message' => 'Pengumuman dihapus.'
         ]);
    }
}
