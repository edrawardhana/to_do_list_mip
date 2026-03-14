<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\AuditLog;

class ProfileController extends Controller
{
    /**
     * Get list of employees (For Admin approval dashboard, or dropdown lists)
     */
    public function index(Request $request)
    {
        $user = Auth::user();

        $query = User::with('division')->select('id', 'full_name', 'username', 'email', 'division_id', 'role', 'shift', 'is_locked');

        // Data Isolation
        if ($user->role === 'user') {
            // Normal users typically only need this to see colleagues in the same division
            // (e.g. for tagging confirmed_participants)
            $query->where('division_id', $user->division_id)
                  ->where('role', 'user');
        } elseif ($user->role === 'admin') {
            // Admin sees everyone in their division
            $query->where('division_id', $user->division_id);
        }
        // super_admin sees everyone

        $profiles = $query->orderBy('full_name', 'asc')->get();

        return response()->json([
            'status' => 'success',
            'data' => $profiles
        ]);
    }

    /**
     * Update employee (Admin approves registration, unlocks account, or assigns shift/role)
     */
    public function update(Request $request, $id)
    {
        $authUser = Auth::user();

        // Only Admin or Superadmin can modify profiles
        if ($authUser->role === 'user') {
            return response()->json(['status' => 'error', 'message' => 'Hanya Admin/HR yang bisa mengelola profil karyawan.'], 403);
        }

        $profile = User::findOrFail($id);

        if ($authUser->role === 'admin' && $profile->division_id !== $authUser->division_id) {
            return response()->json(['status' => 'error', 'message' => 'Anda tidak bisa mengelola karyawan divisi lain.'], 403);
        }

        // Prevent admin from making themselves super_admin
        $roleValidation = $authUser->role === 'super_admin' ? 'sometimes|in:user,admin,super_admin,developer' : 'sometimes|in:user,admin';

        $request->validate([
            'shift' => 'sometimes|in:pagi,middle,siang',
            'is_locked' => 'sometimes|boolean',
            'role' => $roleValidation,
            'division_id' => $authUser->role === 'super_admin' ? 'sometimes|uuid|exists:divisions,id' : ''
        ]);

        $dataToUpdate = $request->only(['shift', 'is_locked', 'role']);
        
        if ($authUser->role === 'super_admin' && $request->has('division_id')) {
            $dataToUpdate['division_id'] = $request->division_id;
        }

        $profile->update($dataToUpdate);

        $actionDetail = "Meresmikan/Memperbarui Data Karyawan: {$profile->full_name} (Shift: {$profile->shift}, Locked: {$profile->is_locked})";
        AuditLog::record($authUser->id, 'Update Karyawan', $actionDetail, $profile->id);

        return response()->json([
            'status' => 'success',
            'message' => 'Profil karyawan berhasil diperbarui.',
            'data' => $profile
        ]);
    }
}
