<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuditLogController extends Controller
{
    /**
     * Get system audit logs
     */
    public function index(Request $request)
    {
        $user = Auth::user();

        // Security: Normal users cannot see audit logs
        if ($user->role === 'user') {
            return response()->json(['status' => 'error', 'message' => 'Anda tidak berhak mengakses log sistem.'], 403);
        }

        $query = AuditLog::with('actor');

        if ($user->role === 'admin') {
            // Admin can only see logs where the actor belongs to their division
            $query->whereHas('actor', function ($q) use ($user) {
                $q->where('division_id', $user->division_id);
            });
        }
        // super_admin sees everything

        // Sort by newest
        $logs = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'status' => 'success',
            'data' => $logs
        ]);
    }
}
