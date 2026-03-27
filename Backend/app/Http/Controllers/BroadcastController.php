<?php

namespace App\Http\Controllers;

use App\Models\Broadcast;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\AuditLog;

class BroadcastController extends Controller
{
    /**
     * Get list of broadcasts
     */
    public function index(Request $request)
    {
        // All users can see active broadcasts
        // Can filter by non-expired if needed, but returning all for now ordered by newest
        $query = Broadcast::orderBy('created_at', 'desc');

        if ($request->has('active_only') && $request->active_only == 'true') {
            $query->where('expires_at', '>=', now());
        }

        $broadcasts = $query->get();

        return response()->json([
            'status' => 'success',
            'data' => $broadcasts
        ]);
    }

    /**
     * Create a Broadcast
     */
    public function store(Request $request)
    {
        $user = Auth::user();

        if ($user->role !== 'super_admin') {
            return response()->json(['status' => 'error', 'message' => 'Hanya Super Admin yang bisa membuat Broadcast sistem.'], 403);
        }

        $request->validate([
            'title' => 'required|string',
            'content' => 'required|string',
            'category' => 'required|in:info,urgent',
            'expires_at' => 'required|date|after:now'
        ]);

        $broadcast = Broadcast::create([
            'author_id' => $user->id,
            'title' => $request->title,
            'content' => $request->content,
            'category' => $request->category,
            'expires_at' => $request->expires_at,
            'created_at' => now()
        ]);

        AuditLog::record($user->id, $user->role, 'Buat Broadcast', $broadcast->toArray());

        return response()->json([
            'status' => 'success',
            'message' => 'Broadcast berhasil dibuat.',
            'data' => $broadcast
        ], 201);
    }

    /**
     * Update Broadcast
     */
    public function update(Request $request, $id)
    {
        $user = Auth::user();

        if ($user->role !== 'super_admin') {
            return response()->json(['status' => 'error', 'message' => 'Hanya Super Admin yang bisa mengubah Broadcast.'], 403);
        }

        $broadcast = Broadcast::findOrFail($id);
        $old_values = $broadcast->toArray();

        $request->validate([
            'title' => 'sometimes|string',
            'content' => 'sometimes|string',
            'category' => 'sometimes|in:info,urgent',
            'expires_at' => 'sometimes|date|after:now'
        ]);

        $broadcast->update($request->only(['title', 'content', 'category', 'expires_at']));

        AuditLog::record($user->id, $user->role, 'Update Broadcast', $broadcast->fresh()->toArray(), $old_values);

        return response()->json([
            'status' => 'success',
            'message' => 'Broadcast berhasil diperbarui.',
            'data' => $broadcast
        ]);
    }

    /**
     * Delete Broadcast
     */
    public function destroy($id)
    {
        $user = Auth::user();

        if ($user->role !== 'super_admin') {
            return response()->json(['status' => 'error', 'message' => 'Hanya Super Admin yang bisa menghapus Broadcast.'], 403);
        }

        $broadcast = Broadcast::findOrFail($id);
        $old_values = $broadcast->toArray();
        $broadcast->delete();

        AuditLog::record($user->id, $user->role, 'Hapus Broadcast', null, $old_values);

        return response()->json([
            'status' => 'success',
            'message' => 'Broadcast berhasil dihapus.'
        ]);
    }
}
