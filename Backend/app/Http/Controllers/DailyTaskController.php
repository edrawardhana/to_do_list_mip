<?php

namespace App\Http\Controllers;

use App\Models\DailyTask;
use Illuminate\Http\Request;
use Carbon\Carbon;

class DailyTaskController extends Controller
{
    /**
     * Ambil daftar tugas hari ini untuk user yang login.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $today = Carbon::today()->toDateString();

        $tasks = DailyTask::where('user_id', $user->id)
            ->where('tanggal', $today)
            ->get();

        return response()->json($tasks);
    }

    /**
     * Update status tugas (checklist).
     */
    public function update(Request $request, $id)
    {
        $user = $request->user();
        $task = DailyTask::where('user_id', $user->id)->findOrFail($id);

        $request->validate([
            'status' => 'required|in:pending,selesai',
        ]);

        $task->status = $request->status;
        $task->waktu_checklist = $request->status === 'selesai' ? Carbon::now()->toTimeString() : null;
        $task->save();

        return response()->json([
            'message' => 'Status tugas berhasil diperbarui.',
            'task' => $task
        ]);
    }
}
