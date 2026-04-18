<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User;
use App\Models\DailyTask;
use App\Models\AuditLog;

class AdminDashboardController extends Controller
{
    public function index()
    {
        $admin = Auth::user();

        if (!in_array($admin->role, ['admin', 'super_admin', 'developer'])) {
            return response()->json(['status' => 'error', 'message' => 'Akses ditolak.'], 403);
        }

        $divisionId = $admin->division_id;

        // ── 1. STATS ────────────────────────────────────────────────────────
        $totalInterns = User::whereIn('role', ['intern', 'user'])
            ->where('division_id', $divisionId)
            ->count();

        $pendingTasks = DailyTask::where('division_id', $divisionId)
            ->where('status', 'pending')
            ->count();

        $pendingUsers = User::whereIn('role', ['intern', 'user'])
            ->where('division_id', $divisionId)
            ->where('is_verified', false)
            ->count();

        // ── 2. PIE CHART — Top 5 interns by approved tasks ─────────────────
        $interns = User::whereIn('role', ['intern', 'user'])
            ->where('division_id', $divisionId)
            ->where('is_verified', true)
            ->withCount(['dailyTasks as tasks' => function ($q) {
                $q->where('status', 'approved');
            }])
            ->orderByDesc('tasks')
            ->limit(5)
            ->get(['id', 'full_name']);

        $chartData = $interns->map(fn($i) => [
            'name'  => $i->full_name,
            'tasks' => $i->tasks,
        ])->values();

        // ── 3. ACTIVITY LOG — 8 recent audit logs for this division ─────────
        $activityLogs = AuditLog::with(['actor:id,full_name,role'])
            ->whereHas('actor', fn($q) => $q->where('division_id', $divisionId))
            ->orderBy('created_at', 'desc')
            ->limit(8)
            ->get(['id', 'actor_id', 'actor_role', 'action', 'created_at']);

        return response()->json([
            'status' => 'success',
            'data'   => [
                'totalInterns'  => $totalInterns,
                'pendingTasks'  => $pendingTasks,
                'pendingUsers'  => $pendingUsers,
                'onSiteInterns' => $totalInterns, // same for now
                'chartData'     => $chartData,
                'activityLogs'  => $activityLogs,
            ],
        ]);
    }
}
