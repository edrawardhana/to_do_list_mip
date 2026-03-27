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
            // Both Admin and User can ONLY see their own division's whiteboard
            $query->where('division_id', $user->division_id);
        }

        // Tidak ada kolom created_at di tabel whiteboards menurut ERD.
        $whiteboards = $query->get();

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
            'title' => 'required|string',
            'file_url' => 'required|string',
            'type' => 'required|in:pdf,image,link'
        ]);

        $whiteboard = Whiteboard::create([
            'division_id' => $user->division_id,
            'title' => $request->title,
            'file_url' => $request->file_url,
            'type' => $request->type
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

        if ($user->role === 'user') {
            return response()->json(['status' => 'error', 'message' => 'Akses ditolak.'], 403);
        }

        if ($user->role === 'admin' && $whiteboard->division_id !== $user->division_id) {
            return response()->json(['status' => 'error', 'message' => 'Tugas ini di luar divisi Anda.'], 403);
        }

        $old_values = $whiteboard->toArray();

        $request->validate([
            'title' => 'sometimes|string',
            'file_url' => 'sometimes|string',
            'type' => 'sometimes|in:pdf,image,link'
        ]);

        $whiteboard->update($request->only(['title', 'file_url', 'type']));

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
 
         if ($user->role === 'user') {
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
