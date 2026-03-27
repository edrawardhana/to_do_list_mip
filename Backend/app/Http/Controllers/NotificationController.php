<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    /**
     * Get list of notifications for the current user
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        
        $query = Notification::where('user_id', $user->id)
                             ->orderBy('created_at', 'desc');

        // Optional filter for unread only
        if ($request->has('unread') && $request->unread == 'true') {
            $query->where('is_read', false);
        }

        $notifications = $query->get();

        return response()->json([
            'status' => 'success',
            'data' => $notifications
        ]);
    }

    /**
     * Mark a specific notification as read
     */
    public function update(Request $request, $id)
    {
        $user = Auth::user();

        $notification = Notification::findOrFail($id);

        if ($notification->user_id !== $user->id) {
            return response()->json(['status' => 'error', 'message' => 'Notifikasi ini bukan milik Anda.'], 403);
        }

        $request->validate([
            'is_read' => 'required|boolean'
        ]);

        $notification->update(['is_read' => $request->is_read]);

        return response()->json([
            'status' => 'success',
            'message' => 'Status notifikasi berhasil di-update.',
            'data' => $notification
        ]);
    }

    /**
     * Delete a notification (optional if user wants to clear)
     */
    public function destroy($id)
    {
        $user = Auth::user();
        $notification = Notification::findOrFail($id);

        if ($notification->user_id !== $user->id) {
            return response()->json(['status' => 'error', 'message' => 'Notifikasi ini bukan milik Anda.'], 403);
        }

        $notification->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Notifikasi berhasil dihapus.'
        ]);
    }
}
