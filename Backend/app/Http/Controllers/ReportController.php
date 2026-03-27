<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User;
use App\Models\Schedule;
use App\Models\Exception;
use App\Models\DailyTask;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    /**
     * Get monthly attendance and task completion report.
     */
    public function monthly(Request $request)
    {
        $user = Auth::user();
        
        $month = $request->query('month', date('m'));
        $year = $request->query('year', date('Y'));
        $targetUserId = $request->query('user_id');

        // Security check
        if ($user->role === 'intern') {
            $targetUserId = $user->id; // Forced to themselves
        } else if (!$targetUserId) {
            // If admin/super_admin doesn't specify a user_id, 
            // return an aggregated division/global average report
            return $this->getAggregatedReport($user, $month, $year);
        }

        // Validate if admin is trying to snoop on another division
        if ($user->role === 'admin' && $targetUserId) {
            $targetUser = User::find($targetUserId);
            if (!$targetUser || $targetUser->division_id !== $user->division_id) {
                return response()->json(['error' => 'Forbidden. User not in your division.'], 403);
            }
        }

        // --- SINGLE USER REPORT ---
        
        // 1. Calculate Attendance
        $schedulesTotal = Schedule::where('user_id', $targetUserId)
            ->whereMonth('shift_date', $month)
            ->whereYear('shift_date', $year)
            ->count();

        // Count approved exceptions (absences)
        $exceptionsApproved = Exception::where('user_id', $targetUserId)
            ->where('status', 'approved')
            ->whereMonth('permission_date', $month)
            ->whereYear('permission_date', $year)
            ->count();

        // Default to a standard 22 working days if no schedules are explicitly set
        $baseWorkDays = $schedulesTotal > 0 ? $schedulesTotal : 22;
        $attendanceScore = max(0, $baseWorkDays - $exceptionsApproved);
        $attendancePercentage = round(($attendanceScore / $baseWorkDays) * 100, 2);

        // 2. Calculate Task Completion
        $tasksTotal = DailyTask::where('uploader_id', $targetUserId)
            ->whereMonth('task_date', $month)
            ->whereYear('task_date', $year)
            ->count();

        $tasksApproved = DailyTask::where('uploader_id', $targetUserId)
            ->where('status', 'approved')
            ->whereMonth('task_date', $month)
            ->whereYear('task_date', $year)
            ->count();

        $taskCompletionPercentage = $tasksTotal > 0 ? round(($tasksApproved / $tasksTotal) * 100, 2) : 0;

        return response()->json([
            'month' => (int)$month,
            'year' => (int)$year,
            'user_id' => $targetUserId,
            'attendance' => [
                'total_scheduled_days' => $baseWorkDays,
                'total_absences' => $exceptionsApproved,
                'percentage' => $attendancePercentage
            ],
            'tasks' => [
                'total_tasks' => $tasksTotal,
                'completed_tasks' => $tasksApproved,
                'percentage' => $taskCompletionPercentage
            ]
        ]);
    }

    /**
     * Get aggregated average for admin/super_admin
     */
    private function getAggregatedReport($user, $month, $year)
    {
        $query = User::where('role', 'intern');
        
        if ($user->role === 'admin') {
            $query->where('division_id', $user->division_id);
        }

        $userIds = $query->pluck('id');
        
        if ($userIds->isEmpty()) {
            return response()->json([
                'month' => (int)$month,
                'year' => (int)$year,
                'scope' => $user->role === 'admin' ? 'division' : 'global',
                'average_attendance_percentage' => 0,
                'average_task_completion_percentage' => 0,
                'total_interns' => 0
            ]);
        }

        // Sum everything up
        $schedulesTotal = Schedule::whereIn('user_id', $userIds)
            ->whereMonth('shift_date', $month)
            ->whereYear('shift_date', $year)
            ->count();

        $exceptionsApproved = Exception::whereIn('user_id', $userIds)
            ->where('status', 'approved')
            ->whereMonth('permission_date', $month)
            ->whereYear('permission_date', $year)
            ->count();

        $baseWorkDays = $schedulesTotal > 0 ? $schedulesTotal : (22 * count($userIds));
        $attendanceScore = max(0, $baseWorkDays - $exceptionsApproved);
        $avgAttendancePercentage = round(($attendanceScore / $baseWorkDays) * 100, 2);


        $tasksTotal = DailyTask::whereIn('uploader_id', $userIds)
            ->whereMonth('task_date', $month)
            ->whereYear('task_date', $year)
            ->count();

        $tasksApproved = DailyTask::whereIn('uploader_id', $userIds)
            ->where('status', 'approved')
            ->whereMonth('task_date', $month)
            ->whereYear('task_date', $year)
            ->count();

        $avgTaskCompletionPercentage = $tasksTotal > 0 ? round(($tasksApproved / $tasksTotal) * 100, 2) : 0;

        return response()->json([
            'month' => (int)$month,
            'year' => (int)$year,
            'scope' => $user->role === 'admin' ? 'division' : 'global',
            'average_attendance_percentage' => $avgAttendancePercentage,
            'average_task_completion_percentage' => $avgTaskCompletionPercentage,
            'total_interns' => count($userIds)
        ]);
    }
}
