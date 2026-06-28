<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuditLogController extends Controller
{
    /**
     * Get system audit logs with pagination and filters
     */
    public function index(Request $request)
    {
        $user = Auth::user();

        // Security: Normal users cannot see audit logs
        if ($user->role === 'intern') {
            return response()->json(['status' => 'error', 'message' => 'Anda tidak berhak mengakses log sistem.'], 403);
        }

        $query = AuditLog::with(['actor:id,full_name,role', 'target:id,full_name']);

        if ($user->role === 'admin') {
            $query->whereHas('actor', function ($q) use ($user) {
                $q->where('division_id', $user->division_id)
                  ->where('role', '!=', 'super_admin'); // Sesuaikan string 'super_admin' dengan penulisan role di database kamu (misal: 'superadmin')
            });
        }

        // Filter by action keyword
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('action', 'like', "%{$search}%")
                  ->orWhereHas('actor', fn($a) => $a->where('full_name', 'like', "%{$search}%"))
                  ->orWhereHas('target', fn($t) => $t->where('full_name', 'like', "%{$search}%"));
            });
        }

        // Filter by date (YYYY-MM-DD)
        if ($request->filled('date')) {
            $query->whereDate('created_at', $request->date);
        }

        // Filter by action type
        if ($request->filled('action')) {
            $query->where('action', $request->action);
        }

        $perPage = 15;
        $logs = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return response()->json([
            'status'      => 'success',
            'data'        => $logs->items(),
            'total'       => $logs->total(),
            'per_page'    => $logs->perPage(),
            'current_page'=> $logs->currentPage(),
            'last_page'   => $logs->lastPage(),
        ]);
    }
}
