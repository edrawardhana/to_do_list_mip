<?php

namespace App\Http\Controllers;

use App\Models\AttendanceSchedule;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\AuditLog;

class AttendanceController extends Controller
{
    /**
     * Get user's own leave schedules, or division's schedules if Admin, or all if super_admin
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        
        // Data Isolation logic because Laravel bypasses Supabase RLS
        $query = AttendanceSchedule::with('user'); 

        if ($user->role === 'user') {
            // User only sees their own leave history
            $query->where('user_id', $user->id);
        } elseif ($user->role === 'admin') {
            // Admin sees leave history of everyone IN THEIR DIVISION
            $query->whereHas('user', function ($q) use ($user) {
                $q->where('division_id', $user->division_id);
            });
        }
        // super_admin sees everything (no where clause)

        // Optional filtering by type
        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        $schedules = $query->orderBy('start_date', 'desc')->get();

        return response()->json([
            'status' => 'success',
            'data' => $schedules
        ]);
    }

    /**
     * Apply for Leave/Sick/Swap/Libur
     */
    public function store(Request $request)
    {
        $user = Auth::user();

        // Admin might apply for their team, but generally users apply for themselves.
        // Assuming user applies for themselves here.
        $request->validate([
            'type' => 'required|string|in:Izin,Sakit,Swap,Libur',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'proof_url' => 'nullable|string' // usually a doctor's note or similar
        ]);

        $attendance = AttendanceSchedule::create([
            'user_id' => $user->id,
            'type' => $request->type,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'proof_url' => $request->proof_url,
            'is_approved' => false // Admin must approve it later
        ]);

        AuditLog::record($user->id, 'Pengajuan Absen', "Mengajukan {$request->type} dari {$request->start_date} s/d {$request->end_date}", $attendance->id);

        return response()->json([
            'status' => 'success',
            'message' => 'Berhasil mengajukan permohonan ' . $request->type,
            'data' => $attendance
        ], 201);
    }

    /**
     * Admin/super_admin acts on the leave application (Approve or Reject / Update type)
     * Approving an 'Izin' or 'Sakit' WILL trigger the Supabase Auto-Lock via Database Trigger
     */
    public function update(Request $request, $id)
    {
        $authUser = Auth::user();

        if ($authUser->role === 'user') {
            return response()->json(['status' => 'error', 'message' => 'Hanya Admin yang berhak memproses permohonan absen.'], 403);
        }

        $request->validate([
            'type' => 'sometimes|string|in:Izin,Sakit,Swap,Libur',
            'is_approved' => 'sometimes|boolean'
        ]);

        $attendance = AttendanceSchedule::with('user')->findOrFail($id);

        // Division Isolation check for Admin
        if ($authUser->role === 'admin' && $attendance->user->division_id !== $authUser->division_id) {
            return response()->json(['status' => 'error', 'message' => 'Anda hanya bisa memproses absensi karyawan di divisi Anda sendiri.'], 403);
        }

        try {
            // Updating the fields. 
            // TRICKY PART: The Supabase trigger will fire and automatically lock/unlock the user's profile
            // if the type is 'Izin' or 'Sakit'.
            $dataToUpdate = $request->only(['type', 'is_approved']);
            $attendance->update($dataToUpdate);

            $actionDetail = "Memproses pengajuan absen milik " . $attendance->user->full_name . " (Status: " . ($request->is_approved ? 'Disetujui' : 'Ditolak/Pending') . ")";
            AuditLog::record($authUser->id, 'Proses Absen', $actionDetail, $attendance->id);

            return response()->json([
                'status' => 'success',
                'message' => 'Berhasil memperbarui data absensi.',
                'data' => $attendance
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal mengubah data absen di Database: ' . $e->getMessage()
            ], 500);
        }
    }

     /**
     * Delete an unapproved application or mistake
     */
    public function destroy($id)
    {
         $user = Auth::user();
         $attendance = AttendanceSchedule::findOrFail($id);
 
         // User can only delete their own unapproved application
         if ($user->role === 'user') {
             if ($attendance->user_id !== $user->id || $attendance->is_approved) {
                 return response()->json(['status' => 'error', 'message' => 'Tidak bisa menghapus pengajuan yang sudah diproses atau bukan milik Anda.'], 403);
             }
         } elseif ($user->role === 'admin' && $attendance->user->division_id !== $user->division_id) {
             return response()->json(['status' => 'error', 'message' => 'Anda tidak bisa menghapus absensi divisi lain.'], 403);
         }
 
         $attendance->delete();

         AuditLog::record($user->id, 'Hapus Absen', "Membatalkan/Menghapus pengajuan absen yang belum disetujui", $id);
 
         return response()->json([
             'status' => 'success',
             'message' => 'Pengajuan absen dihapus.'
         ]);
    }
}
