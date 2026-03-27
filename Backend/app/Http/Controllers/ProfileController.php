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

        // ERD v3: Profiles has full_name, nickname, role, division_id, is_verified, is_locked, avatar_url, phone_number
        $query = User::with('division')->select('id', 'full_name', 'nickname', 'division_id', 'role', 'is_verified', 'is_locked', 'avatar_url', 'phone_number');

        // Data Isolation
        if ($user->role === 'intern') {
            // Interns typically only need this to see colleagues in the same division for tagging
            $query->where('division_id', $user->division_id)
                  ->where('role', 'intern');
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
}
