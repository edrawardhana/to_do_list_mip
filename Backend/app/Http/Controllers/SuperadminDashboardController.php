<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User;
use App\Models\Division;
use App\Models\AuditLog;
use App\Models\DailyTask;
use App\Models\Exception as ExceptionModel;

class SuperadminDashboardController extends Controller
{
    /**
     * Aggregate dashboard data for Superadmin.
     * Includes: stats, division performance chart, top interns leaderboard, recent audit logs.
     */
    public function index()
    {
        $authUser = Auth::user();

        // Security: Only super_admin and developer can access this
        if (!in_array($authUser->role, ['super_admin', 'developer'])) {
            return response()->json(['status' => 'error', 'message' => 'Akses ditolak.'], 403);
        }

        // ── 1. GLOBAL STATS ─────────────────────────────────────────────────
        $activeInterns   = User::where('is_verified', true)
                               ->whereIn('role', ['intern'])
                               ->count();

        $totalDivisions  = Division::count();

        $pendingApprovals = ExceptionModel::where('status', 'pending')->count();

        // ── 2. DIVISION PERFORMANCE CHART ───────────────────────────────────
        // Calculate real task completion % per division
        $divisions = Division::with(['profiles' => function ($q) {
            $q->whereIn('role', ['intern'])->select('id', 'division_id');
        }])->orderBy('name', 'asc')->get();

        $divisionPerformance = $divisions->map(function ($div) {
            $internIds = $div->profiles->pluck('id');

            if ($internIds->isEmpty()) {
                return ['name' => $div->name, 'score' => 0];
            }

            $totalTasks    = DailyTask::whereIn('uploader_id', $internIds)->count();
            $approvedTasks = DailyTask::whereIn('uploader_id', $internIds)
                                      ->where('status', 'approved')
                                      ->count();

            $score = $totalTasks > 0 ? round(($approvedTasks / $totalTasks) * 100) : 0;

            return [
                'name'  => \Illuminate\Support\Str::limit($div->name, 8, ''),
                'score' => $score,
            ];
        })->values();

        // ── 3. TOP 3 INTERNS (Global Leaderboard) ───────────────────────────
        // Rank by number of approved daily tasks
        $topInterns = User::whereIn('role', ['intern'])
            ->where('is_verified', true)
            ->withCount(['dailyTasks as approved_tasks_count' => function ($q) {
                $q->where('status', 'approved');
            }])
            ->orderByDesc('approved_tasks_count')
            ->limit(3)
            ->get(['id', 'full_name'])
            ->map(function ($u, $i) {
                $total = DailyTask::where('uploader_id', $u->id)->count();
                $score = $total > 0 ? round(($u->approved_tasks_count / $total) * 100) : 0;

                return [
                    'name'  => $u->full_name,
                    'score' => $score,
                ];
            })->values();

        // ── 4. RECENT AUDIT LOGS (Latest 10) ────────────────────────────────
        $auditLogs = AuditLog::with(['actor:id,full_name,role'])
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get(['id', 'actor_id', 'actor_role', 'action', 'created_at']);

        // ── RESPONSE ─────────────────────────────────────────────────────────
        return response()->json([
            'status' => 'success',
            'data'   => [
                'activeInterns'       => $activeInterns,
                'totalDivisions'      => $totalDivisions,
                'pendingApprovals'    => $pendingApprovals,
                'divisionPerformance' => $divisionPerformance,
                'topInterns'          => $topInterns,
                'auditLogs'           => $auditLogs,
            ],
        ]);
    }
}
