<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\AuditLog;

class ProfileController extends Controller
{
    /**
     * Get list of employees
     * - intern: sees colleagues in same division (for task tagging)
     * - admin: sees ALL interns in their division (verified + unverified, for management)
     * - super_admin/developer: sees everyone
     */
    public function index(Request $request)
    {
        $user = Auth::user();

        $query = User::with('division')
            ->select('id', 'full_name', 'nickname', 'email', 'division_id', 'role',
                     'is_verified', 'is_locked', 'avatar_url', 'phone_number', 'created_at')
            ->whereNull('deleted_at');

        if ($user->role === 'intern') {
            // Intern: only verified colleagues in same division (for tagging)
            $query->where('division_id', $user->division_id)
                  ->where('role', 'intern')
                  ->where('is_verified', true);
        } elseif ($user->role === 'admin') {
            // Admin: all interns in their division (including unverified — for ACC)
            $query->where('division_id', $user->division_id)
                  ->where('role', 'intern');
        }
        // super_admin/developer: no filter

        $profiles = $query->orderBy('is_verified', 'asc')  // unverified first
                          ->orderBy('full_name', 'asc')
                          ->get();

        return response()->json([
            'status' => 'success',
            'data'   => $profiles,
        ]);
    }

    /**
     * Get specific user profile
     */
    public function show($id)
    {
        $profile = User::with('division')->findOrFail($id);
        return response()->json([
            'status' => 'success',
            'data' => $profile
        ]);
    }

    /**
     * Update employee (Admin approves registration, unlocks account, or assigns role)
     */
    public function update(Request $request, $id)
    {
        $authUser = Auth::user();

        // Only Admin or Superadmin can modify other profiles
        if ($authUser->role === 'intern' && $authUser->id !== $id) {
            return response()->json(['status' => 'error', 'message' => 'Hanya Admin/HR yang bisa mengelola profil karyawan lain.'], 403);
        }

        $profile = User::findOrFail($id);

        if ($authUser->role === 'admin' && $profile->division_id !== $authUser->division_id && $authUser->id !== $id) {
            return response()->json(['status' => 'error', 'message' => 'Anda tidak bisa mengelola karyawan divisi lain.'], 403);
        }

        $old_values = $profile->toArray();

        // Role Validation based on who is updating
        $roleValidation = '';
        if ($authUser->role === 'super_admin') {
            $roleValidation = 'sometimes|in:intern,admin,super_admin,developer';
        } elseif ($authUser->role === 'admin') {
            $roleValidation = 'sometimes|in:intern,admin';
        }

        $request->validate([
            'nickname' => 'sometimes|string|max:100',
            'phone_number' => 'sometimes|string|max:20',
            'avatar_url' => 'sometimes|string',
            'is_locked' => $authUser->role !== 'intern' ? 'sometimes|boolean' : '', // only admin+ can lock/unlock
            'is_verified' => $authUser->role !== 'intern' ? 'sometimes|boolean' : '', // only admin+ can verify
            'role' => $roleValidation,
            'division_id' => $authUser->role === 'super_admin' ? 'sometimes|uuid|exists:divisions,id' : ''
        ]);

        $dataToUpdate = $request->only(['nickname', 'phone_number', 'avatar_url']);
        
        // Only Admins can update these security fields
        if ($authUser->role !== 'intern') {
            if ($request->has('is_locked')) $dataToUpdate['is_locked'] = $request->is_locked;
            if ($request->has('is_verified')) $dataToUpdate['is_verified'] = $request->is_verified;
            if ($request->has('role')) $dataToUpdate['role'] = $request->role;
        }

        if ($authUser->role === 'super_admin' && $request->has('division_id')) {
            $dataToUpdate['division_id'] = $request->division_id;
        }

        $profile->update($dataToUpdate);

        AuditLog::record(
            $authUser->id, 
            $authUser->role, 
            'Update Profil Karyawan', 
            $profile->fresh()->toArray(), 
            $old_values, 
            $profile->id
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Profil karyawan berhasil diperbarui.',
            'data' => $profile
        ]);
    }

    /**
     * Delete / reject a user account
     * - super_admin / developer: can delete anyone
     * - admin: can only delete unverified interns in their own division (reject registration)
     */
    public function destroy($id)
    {
        $authUser = Auth::user();
        $profile  = User::findOrFail($id);

        // Prevent self-deletion
        if ($authUser->id === $id) {
            return response()->json(['status' => 'error', 'message' => 'Anda tidak bisa menghapus akun Anda sendiri.'], 403);
        }

        // Admin: can only reject unverified interns in their division
        if ($authUser->role === 'admin') {
            if ($profile->division_id !== $authUser->division_id) {
                return response()->json(['status' => 'error', 'message' => 'Karyawan ini di luar divisi Anda.'], 403);
            }
            if ($profile->is_verified) {
                return response()->json(['status' => 'error', 'message' => 'Admin hanya bisa menolak akun yang belum diverifikasi. Hubungi Superadmin untuk menghapus akun aktif.'], 403);
            }
        } elseif (!in_array($authUser->role, ['super_admin', 'developer'])) {
            return response()->json(['status' => 'error', 'message' => 'Hanya Superadmin atau Developer yang dapat menghapus akun aktif.'], 403);
        }

        // Prevent deleting super_admin/developer unless you are developer
        if (in_array($profile->role, ['super_admin', 'developer']) && $authUser->role !== 'developer') {
            return response()->json(['status' => 'error', 'message' => 'Tidak dapat menghapus akun Superadmin atau Developer.'], 403);
        }

        $profileData = $profile->toArray();
        $profile->delete();

        AuditLog::record(
            $authUser->id,
            $authUser->role,
            $profile->is_verified ? 'Hapus Akun Pengguna' : 'Tolak Registrasi Intern',
            [],
            $profileData,
            $id
        );

        return response()->json([
            'status'  => 'success',
            'message' => 'Akun berhasil dihapus.',
        ]);
    }
    /**
     * Update FCM Token for the authenticated user
     */
    public function updateFcmToken(Request $request)
    {
        $user = Auth::user();

        $request->validate([
            'fcm_token' => 'required|string'
        ]);

        $user->update([
            'fcm_token' => $request->fcm_token
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'FCM Token berhasil diperbarui.'
        ]);
    }
}
