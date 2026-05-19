<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\DailyTask;
use App\Models\User;
use App\Models\Schedule;

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

        // ── 3. SHIFT INFO: real data from schedules table ────────────────────
        // Get all interns in the same division (excluding self)
        $divisionUsers = User::where('division_id', $intern->division_id)
            ->whereIn('role', ['intern'])
            ->where('is_verified', true)
            ->where('id', '!=', $intern->id)
            ->get(['id', 'full_name']);

        $divisionUserIds = $divisionUsers->pluck('id');

        // Get today's schedules for all division members
        $todaySchedules = Schedule::whereIn('user_id', $divisionUserIds)
            ->whereDate('shift_date', $today)
            ->get(['user_id', 'shift_type']);

        // Map user_id -> shift_type
        $scheduleMap = $todaySchedules->keyBy('user_id');

        $pagi  = [];
        $middle = [];
        $siang = [];
        $full  = [];
        $libur = [];

        foreach ($divisionUsers as $u) {
            $schedule = $scheduleMap->get($u->id);
            if (!$schedule) {
                $libur[] = $u->full_name;
            } elseif ($schedule->shift_type === 'morning') {
                $pagi[] = $u->full_name;
            } elseif ($schedule->shift_type === 'middle') {
                $middle[] = $u->full_name;
            } elseif ($schedule->shift_type === 'afternoon') {
                $siang[] = $u->full_name;
            } elseif ($schedule->shift_type === 'full') {
                $full[] = $u->full_name;
            } else {
                $libur[] = $u->full_name;
            }
        }

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
                    'pagi'   => $pagi,
                    'middle' => $middle,
                    'siang'  => $siang,
                    'full'   => $full,
                    'libur'  => $libur,
                ],
            ],
        ]);
    }
}
