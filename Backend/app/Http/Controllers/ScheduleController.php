<?php

namespace App\Http\Controllers;

use App\Models\Schedule;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\AuditLog;

class ScheduleController extends Controller
{
    /**
     * Get list of schedules
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        
        $query = Schedule::with(['user:id,full_name,division_id,role']);

        if ($user->role === 'intern') {
            $query->where('user_id', $user->id);
        } elseif ($user->role === 'admin') {
            $query->whereHas('user', function($q) use ($user) {
                $q->where('division_id', $user->division_id)
                  ->whereNull('deleted_at');
            });
        }
        // superadmin sees all

        if ($request->has('date')) {
            $query->whereDate('shift_date', $request->date);
        }

        $schedules = $query->orderBy('shift_date', 'asc')->get();

        return response()->json([
            'status' => 'success',
            'data'   => $schedules,
        ]);
    }

    /**
     * Set a shift schedule for an intern
     */
    public function store(Request $request)
    {
        $admin = Auth::user();

        if ($admin->role === 'intern') {
            return response()->json(['status' => 'error', 'message' => 'Hanya Admin/HR yang bisa mengatur jadwal shift.'], 403);
        }

        $request->validate([
            'user_id' => 'required|uuid|exists:profiles,id',
            'shift_date' => 'required|date',
            'shift_type' => 'required|in:morning,middle,afternoon,full'
        ]);

        $intern = User::findOrFail($request->user_id);

        if ($admin->role === 'admin' && $intern->division_id !== $admin->division_id) {
            return response()->json(['status' => 'error', 'message' => 'Karyawan ini di luar divisi Anda.'], 403);
        }

        // Prevent duplicate shift for the same user on the same date
        $exists = Schedule::where('user_id', $intern->id)->whereDate('shift_date', $request->shift_date)->first();
        if ($exists) {
            return response()->json(['status' => 'error', 'message' => 'Jadwal shift untuk tanggal tersebut sudah ada.'], 400); // Badrequest instead of create
        }

        $schedule = Schedule::create([
            'user_id' => $intern->id,
            'shift_date' => $request->shift_date,
            'shift_type' => $request->shift_type,
            'created_at' => now()
        ]);

        AuditLog::record(
            $admin->id, 
            $admin->role, 
            'Assign Shift Karyawan', 
            $schedule->toArray(), 
            null, 
            $intern->id
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Jadwal shift berhasil ditambahkan.',
            'data' => $schedule
        ], 201);
    }

    /**
     * Update an existing shift
     */
    public function update(Request $request, $id)
    {
        $admin = Auth::user();

        if ($admin->role === 'intern') {
            return response()->json(['status' => 'error', 'message' => 'Hanya Admin/HR yang bisa merubah jadwal shift.'], 403);
        }

        $schedule = Schedule::findOrFail($id);
        $intern = $schedule->user;

        if ($admin->role === 'admin' && $intern->division_id !== $admin->division_id) {
            return response()->json(['status' => 'error', 'message' => 'Karyawan ini di luar divisi Anda.'], 403);
        }

        $old_values = $schedule->toArray();

        $request->validate([
            'shift_date' => 'sometimes|date',
            'shift_type' => 'sometimes|in:morning,middle,afternoon,full'
        ]);

        $schedule->update($request->only(['shift_date', 'shift_type']));

        AuditLog::record(
            $admin->id, 
            $admin->role, 
            'Update Shift Karyawan', 
            $schedule->fresh()->toArray(), 
            $old_values, 
            $intern->id
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Jadwal shift berhasil di-update.',
            'data' => $schedule
        ]);
    }

    /**
     * Delete a schedule
     */
    public function destroy($id)
    {
        $admin = Auth::user();

        if ($admin->role === 'intern') {
            return response()->json(['status' => 'error', 'message' => 'Hanya Admin/HR yang bisa menghapus jadwal shift.'], 403);
        }

        $schedule = Schedule::findOrFail($id);
        $intern = $schedule->user;

        if ($admin->role === 'admin' && $intern->division_id !== $admin->division_id) {
            return response()->json(['status' => 'error', 'message' => 'Karyawan ini di luar divisi Anda.'], 403);
        }

        $old_values = $schedule->toArray();
        $schedule->delete();

        AuditLog::record(
            $admin->id, 
            $admin->role, 
            'Hapus Shift Karyawan', 
            null, 
            $old_values, 
            $intern->id
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Jadwal shift berhasil dihapus.'
        ]);
    }
}
