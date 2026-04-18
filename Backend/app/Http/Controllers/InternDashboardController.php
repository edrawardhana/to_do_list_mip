<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\DailyTask;
use App\Models\User;

class InternDashboardController extends Controller
{
    public function index()
    {
        $intern = Auth::user();
        $today  = now()->toDateString();

        // ── 1. TODAY TASKS (templates copied for today) ──────────────────────
        $todayTasks = DailyTask::with(['taskTemplate'])
            ->where('uploader_id', $intern->id)
            ->whereDate('task_date', $today)
            ->get()
            ->map(fn($t) => [
                'id'       => $t->id,
                'title'    => $t->taskTemplate?->title ?? $t->description ?? 'Tugas Harian',
                'status'   => $t->status,
                'icon'     => 'fa-list-check',
                'location' => $t->description ?? 'Tidak ada catatan',
            ]);

        // ── 2. PROGRESS: task completion today ──────────────────────────────
        $total     = DailyTask::where('uploader_id', $intern->id)->whereDate('task_date', $today)->count();
        $completed = DailyTask::where('uploader_id', $intern->id)->whereDate('task_date', $today)->where('status', 'approved')->count();
        $percentage = $total > 0 ? (int) round(($completed / $total) * 100) : 0;

        // ── 3. SHIFT INFO: who's in the same division today ──────────────────
        $divisionUsers = User::where('division_id', $intern->division_id)
            ->whereIn('role', ['intern', 'user'])
            ->where('is_verified', true)
            ->where('id', '!=', $intern->id)
            ->get(['id', 'full_name']);

        // Simple split for display — real shift would come from schedules table
        $names = $divisionUsers->pluck('full_name')->toArray();
        $chunks = array_chunk($names, max(1, (int) ceil(count($names) / 3)));

        return response()->json([
            'status' => 'success',
            'data'   => [
                'todayTasks' => $todayTasks,
                'progress'   => [
                    'percentage' => $percentage,
                    'completed'  => $completed,
                    'total'      => $total,
                ],
                'shiftInfo' => [
                    'pagi'  => $chunks[0] ?? [],
                    'siang' => $chunks[1] ?? [],
                    'libur' => $chunks[2] ?? [],
                ],
            ],
        ]);
    }
}
