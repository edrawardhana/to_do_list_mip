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
     * Get broadcast history formatted mapping for frontend UI.
     */
    public function history()
    {
        $broadcasts = Broadcast::with('author')->orderBy('created_at', 'desc')->get();
        
        $formatted = $broadcasts->map(function($b) {
            return [
                'id' => $b->id,
                'title' => $b->title,
                'date' => $b->created_at ? $b->created_at->format('d M Y, H:i') : now()->format('d M Y, H:i'),
                'target' => 'Global (Semua Intern)', // default mapping
                'sender' => $b->author ? ($b->author->full_name ?? 'Admin') : 'Superadmin',
            ];
        });

        return response()->json([
            'status' => 'success',
            'data' => $formatted
        ]);
    }

    /**
     * Send Broadcast Notifications (Mock for FCM)
     */
    public function send(Request $request)
    {
        $user = Auth::user();

        $request->validate([
            'title' => 'required|string',
            'content' => 'required|string',
            'targetType' => 'required|string'
        ]);

        $broadcast = Broadcast::create([
            'author_id' => $user->id,
            'title' => $request->title,
            'content' => $request->content,
            'category' => 'info',
            'expires_at' => now()->addDays(7), // dummy expiration
            'created_at' => now()
        ]);

        AuditLog::record($user->id, $user->role, 'Send Broadcast FCM', $broadcast->toArray());

        return response()->json([
            'status' => 'success',
            'message' => 'Broadcast berhasil dikirim.',
            'data' => $broadcast
        ], 201);
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
