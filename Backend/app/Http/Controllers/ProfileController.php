<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use App\Models\AuditLog;
use App\Models\Division;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;
use Intervention\Image\Encoders\JpegEncoder;
use Intervention\Image\Encoders\PngEncoder;

class ProfileController extends Controller
{
    /**
     * Get list of employees
     * - intern: sees verified colleagues in same division (for task tagging)
     * - admin: sees ALL interns in their division (for management)
     * - super_admin: sees everyone
     */
    public function index(Request $request)
    {
        $user = Auth::user();

        $query = User::with('division')
            ->select('id', 'full_name', 'nickname', 'email', 'division_id', 'role',
                     'is_verified', 'is_locked', 'avatar_url', 'phone_number', 'created_at', 'internship_batch')
            ->whereNull('deleted_at');

        if ($user->role === 'intern') {
            // Intern: only verified colleagues in same division who share the same shift type today
            $today = now()->setTimezone('Asia/Jakarta')->toDateString();

            // Find current user's shift type today
            $mySchedule = \App\Models\Schedule::where('user_id', $user->id)
                ->whereDate('shift_date', $today)
                ->first();

            if ($mySchedule) {
                $myShiftType = $mySchedule->shift_type;
                // Query users who have a schedule today with the same shift type
                $query->whereIn('id', function($q) use ($today, $myShiftType) {
                    $q->select('user_id')
                      ->from('schedules')
                      ->whereDate('shift_date', $today)
                      ->where('shift_type', $myShiftType);
                });
            } else {
                // If the logged-in intern has NO shift scheduled today, they cannot see/mention anyone
                $query->whereRaw('1 = 0');
            }

            $query->where('division_id', $user->division_id)
                  ->where('role', 'intern')
                  ->where('is_verified', true);
        } elseif ($user->role === 'admin') {
            // Admin: all interns in their division (including unverified — for management)
            $query->where('division_id', $user->division_id)
                  ->where('role', 'intern');
        }
        // super_admin: no filter — sees everyone

        // Optional filters
        if ($request->has('internship_batch') && $request->internship_batch !== '') {
            $query->where('internship_batch', $request->internship_batch);
        }

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
     * Download CSV template for import
     * GET /api/profiles/template-csv
     */
    public function downloadTemplateCsv()
    {
        $authUser = Auth::user();

        if ($authUser->role !== 'super_admin') {
            return response()->json(['status' => 'error', 'message' => 'Hanya Superadmin yang dapat mengunduh template.'], 403);
        }

        $csvContent = "full_name,email,username,division_name,role,internship_batch\n";
        $csvContent .= "Budi Santoso,budi@mip.co.id,budisan,IT,intern,Batch 1 2026\n";
        $csvContent .= "Siti Aminah,siti@mip.co.id,sitiamin,Media dan Production,admin,\n";

        $filename = 'format_import_users.csv';

        return response($csvContent, 200)
            ->header('Content-Type', 'text/csv; charset=UTF-8')
            ->header('Content-Disposition', 'attachment; filename="' . $filename . '"')
            ->header('Cache-Control', 'no-cache, no-store, must-revalidate')
            ->header('Pragma', 'no-cache')
            ->header('Expires', '0');
    }

    /**
     * Superadmin: buat akun secara manual (1 akun)
     * POST /api/profiles/store-manual
     */
    public function storeManual(Request $request)
    {
        $authUser = Auth::user();

        if ($authUser->role !== 'super_admin') {
            return response()->json(['status' => 'error', 'message' => 'Hanya Superadmin yang dapat membuat akun.'], 403);
        }

        $request->validate([
            'full_name'        => 'required|string|max:255',
            'email'            => 'required|email|unique:profiles,email',
            'username'         => 'required|string|max:100|unique:profiles,username',
            'division_id'      => 'required|uuid|exists:divisions,id',
            'role'             => 'required|in:intern,admin,super_admin',
            'password'         => 'nullable|string|min:6',
            'internship_batch' => 'nullable|string|max:100',
        ]);

        // Auto-generate password jika tidak diisi
        $plainPassword = $request->password ?: ('MIP-' . rand(100000, 999999));

        $profile = User::create([
            'full_name'        => $request->full_name,
            'email'            => $request->email,
            'username'         => $request->username,
            'division_id'      => $request->division_id,
            'role'             => $request->role,
            'password_hash'    => Hash::make($plainPassword),
            'is_verified'      => true,
            'is_locked'        => false,
            'internship_batch' => $request->internship_batch,
            'needs_password_change' => true,
        ]);

        AuditLog::record($authUser->id, $authUser->role, 'Buat Akun Manual', [
            'user_id'  => $profile->id,
            'username' => $profile->username,
            'role'     => $profile->role,
        ]);

        return response()->json([
            'status'  => 'success',
            'message' => 'Akun berhasil dibuat.',
            'data'    => [
                'profile'        => $profile->makeVisible(['id', 'full_name', 'email', 'username', 'role', 'division_id', 'internship_batch']),
                'plain_password' => $plainPassword, // Dikembalikan sekali untuk ditampilkan ke Superadmin
            ],
        ], 201);
    }

    /**
     * Download detail user yang baru dibuat sebagai CSV
     * POST /api/profiles/download-user-detail
     */
    public function downloadUserDetail(Request $request)
    {
        $authUser = Auth::user();

        if ($authUser->role !== 'super_admin') {
            return response()->json(['status' => 'error', 'message' => 'Hanya Superadmin yang dapat mengunduh detail user.'], 403);
        }

        $request->validate([
            'full_name'        => 'required|string',
            'email'            => 'required|string',
            'username'         => 'required|string',
            'role'             => 'required|string',
            'division_name'    => 'required|string',
            'password'         => 'required|string',
            'internship_batch' => 'nullable|string',
        ]);

        $csvContent = "full_name,email,username,division_name,role,password,internship_batch\n";
        $csvContent .= sprintf(
            '"%s","%s","%s","%s","%s","%s","%s"',
            $request->full_name,
            $request->email,
            $request->username,
            $request->division_name,
            $request->role,
            $request->password,
            $request->internship_batch ?? ''
        );

        $filename = 'user_detail_' . $request->username . '_' . date('YmdHis') . '.csv';

        return response($csvContent, 200)
            ->header('Content-Type', 'text/csv; charset=UTF-8')
            ->header('Content-Disposition', 'attachment; filename="' . $filename . '"')
            ->header('Cache-Control', 'no-cache, no-store, must-revalidate')
            ->header('Pragma', 'no-cache')
            ->header('Expires', '0');
    }

    /**
     * Superadmin: impor akun massal dari CSV
     * POST /api/profiles/import-csv
     * Kolom CSV: full_name, email, username, division_name, role, password (opsional), internship_batch (opsional)
     */
    public function importCsv(Request $request)
    {
        $authUser = Auth::user();

        if ($authUser->role !== 'super_admin') {
            return response()->json(['status' => 'error', 'message' => 'Hanya Superadmin yang dapat mengimpor akun massal.'], 403);
        }

        $request->validate([
            'csv_file' => 'required|file|mimes:csv,txt|max:5120',
        ]);

        $file    = $request->file('csv_file');
        $lines   = array_filter(array_map('str_getcsv', file($file->getPathname())));
        $header  = array_map('trim', array_shift($lines));

        // Pre-load semua divisions ke memory untuk efisiensi
        $divisions = Division::all()->keyBy(fn($d) => strtolower(trim($d->name)));

        $created  = [];
        $errors   = [];

        foreach ($lines as $lineNum => $row) {
            $data = array_combine($header, array_map('trim', $row));

            $divisionName = strtolower($data['division_name'] ?? '');
            $division     = $divisions[$divisionName] ?? null;

            if (!$division) {
                $errors[] = "Baris " . ($lineNum + 2) . ": Divisi '{$data['division_name']}' tidak ditemukan.";
                continue;
            }

            $role = $data['role'] ?? 'intern';
            if (!in_array($role, ['intern', 'admin', 'super_admin'])) {
                $errors[] = "Baris " . ($lineNum + 2) . ": Role '{$role}' tidak valid.";
                continue;
            }

            $existingUser = User::where('email', $data['email'] ?? '')
                                ->orWhere('username', $data['username'] ?? '')
                                ->first();

            $plainPassword = !empty($data['password']) ? $data['password'] : ('MIP-' . rand(100000, 999999));

            if ($existingUser) {
                $errors[] = "Baris " . ($lineNum + 2) . ": Email/username '{$data['username']}' sudah terdaftar.";
                continue;
            }

            // Jika benar-benar baru, buat baru
            $profile = User::create([
                'full_name'        => $data['full_name'],
                'email'            => $data['email'],
                'username'         => $data['username'],
                'division_id'      => $division->id,
                'role'             => $role,
                'password_hash'    => Hash::make($plainPassword),
                'is_verified'      => true,
                'is_locked'        => false,
                'internship_batch' => $data['internship_batch'] ?? null,
                'needs_password_change' => true,
            ]);

            $created[] = [
                'full_name' => $profile->full_name,
                'username'  => $profile->username,
                'email'     => $profile->email,
                'role'      => $profile->role,
                'division'  => $division->name,
                'password'  => $plainPassword,
            ];
        }

        AuditLog::record($authUser->id, $authUser->role, 'Impor Akun Massal CSV', [
            'created_count' => count($created),
            'error_count'   => count($errors),
        ]);

        return response()->json([
            'status'  => 'success',
            'message' => count($created) . ' akun berhasil diimpor.',
            'data'    => [
                'created' => $created,
                'errors'  => $errors,
            ],
        ]);
    }

    /**
     * Bulk Lock / Nonaktifkan Akun Massal
     * POST /api/profiles/bulk-lock
     */
    public function bulkLock(Request $request)
    {
        $authUser = Auth::user();

        if (!in_array($authUser->role, ['super_admin', 'admin'])) {
            return response()->json(['status' => 'error', 'message' => 'Akses ditolak.'], 403);
        }

        $request->validate([
            'ids'   => 'required|array|min:1',
            'ids.*' => 'uuid|exists:profiles,id',
            'lock'  => 'required|boolean',
        ]);

        $query = User::whereIn('id', $request->ids);

        // Admin divisi hanya bisa mengunci intern di divisinya sendiri
        if ($authUser->role === 'admin') {
            $query->where('division_id', $authUser->division_id)->where('role', 'intern');
        }

        $count = $query->update(['is_locked' => $request->lock]);

        AuditLog::record($authUser->id, $authUser->role, $request->lock ? 'Kunci Akun Massal' : 'Buka Kunci Akun Massal', [
            'ids'   => $request->ids,
            'count' => $count,
        ]);

        return response()->json([
            'status'  => 'success',
            'message' => $count . ' akun berhasil ' . ($request->lock ? 'dikunci.' : 'dibuka kuncinya.'),
        ]);
    }

    /**
     * Bulk Destroy / Hapus Akun Massal
     * POST /api/profiles/bulk-destroy
     */
    public function bulkDestroy(Request $request)
    {
        $authUser = Auth::user();

        if (!in_array($authUser->role, ['super_admin', 'admin'])) {
            return response()->json(['status' => 'error', 'message' => 'Akses ditolak.'], 403);
        }

        $request->validate([
            'ids'   => 'required|array|min:1',
            'ids.*' => 'uuid|exists:profiles,id',
        ]);

        $query = User::whereIn('id', $request->ids)
            ->where('id', '!=', $authUser->id); // Cegah self-deletion

        // Admin divisi hanya bisa menghapus intern di divisinya sendiri
        if ($authUser->role === 'admin') {
            $query->where('division_id', $authUser->division_id)->where('role', 'intern');
        } else {
            // Superadmin tidak bisa hapus super_admin lain
            $query->where('role', '!=', 'super_admin');
        }

        $profiles = $query->get();
        $count    = 0;

        DB::transaction(function() use ($profiles, $authUser, &$count) {
            DB::statement("SET session_replication_role = replica");
            foreach ($profiles as $profile) {
                $profileData = $profile->toArray();
                AuditLog::record($authUser->id, $authUser->role, 'Hapus Akun Massal', [], $profileData, $profile->id);
                $profile->delete();
                $count++;
            }
            DB::statement("SET session_replication_role = DEFAULT");
        });

        return response()->json([
            'status'  => 'success',
            'message' => $count . ' akun berhasil dihapus.',
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
            $roleValidation = 'sometimes|in:intern,admin,super_admin';
        } elseif ($authUser->role === 'admin') {
            $roleValidation = 'sometimes|in:intern,admin';
        }

        $request->validate([
            'nickname'         => 'sometimes|string|max:100',
            'full_name'        => 'sometimes|string|max:255',
            'username'         => 'sometimes|string|max:100|unique:profiles,username,' . $id,
            'phone_number'     => 'sometimes|string|max:20',
            'avatar_url'       => 'sometimes|string',
            'internship_batch' => 'sometimes|nullable|string|max:100',
            'is_locked'        => $authUser->role !== 'intern' ? 'sometimes|boolean' : '',
            'is_verified'      => $authUser->role !== 'intern' ? 'sometimes|boolean' : '',
            'role'             => $roleValidation,
            'division_id'      => $authUser->role === 'super_admin' ? 'sometimes|uuid|exists:divisions,id' : ''
        ]);

        $dataToUpdate = $request->only(['nickname', 'full_name', 'username', 'phone_number', 'avatar_url', 'internship_batch']);

        // Only Admins can update these security fields
        if ($authUser->role !== 'intern') {
            if ($request->has('is_locked'))   $dataToUpdate['is_locked']   = $request->is_locked;
            if ($request->has('is_verified')) $dataToUpdate['is_verified'] = $request->is_verified;
            if ($request->has('role'))        $dataToUpdate['role']        = $request->role;
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
            'status'  => 'success',
            'message' => 'Profil karyawan berhasil diperbarui.',
            'data'    => $profile
        ]);
    }

    /**
     * Delete / reject a user account
     * - super_admin: can delete intern/admin
     * - admin: can delete intern di divisinya sendiri (verified atau tidak)
     */
    public function destroy($id)
    {
        $authUser = Auth::user();
        $profile  = User::findOrFail($id);

        // Prevent self-deletion
        if ($authUser->id === $id) {
            return response()->json(['status' => 'error', 'message' => 'Anda tidak bisa menghapus akun Anda sendiri.'], 403);
        }

        // Admin: can delete intern in their own division (verified or not — for batch cleanup)
        if ($authUser->role === 'admin') {
            if ($profile->division_id !== $authUser->division_id) {
                return response()->json(['status' => 'error', 'message' => 'Karyawan ini di luar divisi Anda.'], 403);
            }
            if ($profile->role !== 'intern') {
                return response()->json(['status' => 'error', 'message' => 'Admin hanya bisa menghapus akun intern.'], 403);
            }
        } elseif ($authUser->role === 'super_admin') {
            // Superadmin tidak bisa hapus superadmin lain
            if ($profile->role === 'super_admin') {
                return response()->json(['status' => 'error', 'message' => 'Tidak dapat menghapus akun Superadmin.'], 403);
            }
        } else {
            return response()->json(['status' => 'error', 'message' => 'Akses ditolak.'], 403);
        }

        $profileData = $profile->toArray();
        
        AuditLog::record(
            $authUser->id,
            $authUser->role,
            $profile->is_verified ? 'Hapus Akun Pengguna' : 'Tolak Registrasi Intern',
            [],
            $profileData,
            $id
        );

        DB::transaction(function() use ($profile) {
            DB::statement("SET session_replication_role = replica");
            $profile->delete();
            DB::statement("SET session_replication_role = DEFAULT");
        });

        return response()->json([
            'status'  => 'success',
            'message' => 'Akun berhasil dihapus.',
        ]);
    }

    /**
     * POST /api/profiles/{id}/reset-password
     * Reset password and generate a temporary password for a user.
     */
    public function resetPassword($id)
    {
        $authUser = Auth::user();
        $profile  = User::findOrFail($id);

        // 1. Role-based Authorization Checks
        if (!in_array($authUser->role, ['super_admin', 'admin'])) {
            return response()->json(['status' => 'error', 'message' => 'Akses ditolak.'], 403);
        }

        if ($authUser->role === 'admin') {
            if ($profile->division_id !== $authUser->division_id) {
                return response()->json(['status' => 'error', 'message' => 'Karyawan ini di luar divisi Anda.'], 403);
            }
            if ($profile->role !== 'intern') {
                return response()->json(['status' => 'error', 'message' => 'Admin hanya bisa mereset password akun intern.'], 403);
            }
        } elseif ($authUser->role === 'super_admin') {
            // Prevent resetting other super admins' passwords
            if ($profile->role === 'super_admin' && $profile->id !== $authUser->id) {
                return response()->json(['status' => 'error', 'message' => 'Tidak dapat mereset password akun Superadmin lain.'], 403);
            }
        }

        // 2. Generate memorable temporary password (e.g. MIP-482015)
        $temporaryPassword = 'MIP-' . rand(100000, 999999);

        // 3. Update password hash and flag for forced password change
        $profile->update([
            'password_hash'         => Hash::make($temporaryPassword),
            'needs_password_change' => true,
        ]);

        // 4. Record action in audit logs for security tracking
        AuditLog::record(
            $authUser->id,
            $authUser->role,
            'Reset Password Pengguna',
            [
                'target_username'       => $profile->username,
                'target_email'          => $profile->email,
                'needs_password_change' => true
            ],
            [],
            $profile->id
        );

        return response()->json([
            'status'             => 'success',
            'message'            => 'Password berhasil direset.',
            'temporary_password' => $temporaryPassword,
        ]);
    }

    /**
     * POST /api/profiles/bulk-reset-password
     * Reset password for multiple users at once.
     */
    public function bulkResetPassword(Request $request)
    {
        $authUser = Auth::user();

        if (!in_array($authUser->role, ['super_admin', 'admin'])) {
            return response()->json(['status' => 'error', 'message' => 'Akses ditolak.'], 403);
        }

        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'required|uuid|exists:profiles,id',
        ]);

        $ids = $request->ids;
        $profiles = User::whereIn('id', $ids)->get();

        $resets = [];
        $errors = [];

        foreach ($profiles as $profile) {
            // 1. Role-based Authorization Checks
            if ($authUser->role === 'admin') {
                if ($profile->division_id !== $authUser->division_id) {
                    $errors[] = "Akun {$profile->full_name} di luar divisi Anda.";
                    continue;
                }
                if ($profile->role !== 'intern') {
                    $errors[] = "Akun {$profile->full_name} bukan akun intern.";
                    continue;
                }
            } elseif ($authUser->role === 'super_admin') {
                // Prevent resetting other super admins' passwords
                if ($profile->role === 'super_admin' && $profile->id !== $authUser->id) {
                    $errors[] = "Tidak dapat mereset password akun Superadmin {$profile->full_name}.";
                    continue;
                }
            }

            // 2. Generate memorable temporary password (e.g. MIP-482015)
            $temporaryPassword = 'MIP-' . rand(100000, 999999);

            // 3. Update password hash and flag for forced password change
            $profile->update([
                'password_hash'         => Hash::make($temporaryPassword),
                'needs_password_change' => true,
            ]);

            // 4. Record action in audit logs for security tracking
            AuditLog::record(
                $authUser->id,
                $authUser->role,
                'Reset Password Pengguna (Massal)',
                [
                    'target_username'       => $profile->username,
                    'target_email'          => $profile->email,
                    'needs_password_change' => true
                ],
                [],
                $profile->id
            );

            $resets[] = [
                'full_name' => $profile->full_name ?? $profile->name ?? 'Unknown',
                'username'  => $profile->username,
                'email'     => $profile->email,
                'role'      => $profile->role,
                'password'  => $temporaryPassword,
            ];
        }

        return response()->json([
            'status'  => 'success',
            'message' => count($resets) . ' password berhasil direset.',
            'data'    => [
                'resets' => $resets,
                'errors' => $errors,
            ]
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
            'status'  => 'success',
            'message' => 'FCM Token berhasil diperbarui.'
        ]);
    }

    /**
     * POST /api/profiles/avatar
     * Upload and update user avatar dynamically using Supabase S3 or Local storage.
     */
    public function uploadAvatar(Request $request)
    {
        $request->validate([
            'avatar' => 'required|image|mimes:jpeg,png,jpg,webp|max:2048',
        ]);

        $user = Auth::user();
        $file = $request->file('avatar');

        // 1. Compress & Resize Image to premium 300x300 square
        $manager      = new ImageManager(new Driver());
        $image        = $manager->read($file);
        $image->cover(300, 300);

        $encodedImage = $image->encode(new JpegEncoder(quality: 80));

        // 2. Define Upload Path
        $filename    = 'avatar_' . $user->id . '_' . time() . '.jpg';
        $storagePath = $filename;

        // 3. Delete Old Avatar if exists
        if ($user->avatar_url) {
            if (str_contains($user->avatar_url, '/storage/')) {
                $oldPath = str_replace('/storage/', '', parse_url($user->avatar_url, PHP_URL_PATH));
                Storage::disk('public')->delete($oldPath);
            } else {
                $baseUrl = env('SUPABASE_STORAGE_URL');
                if ($baseUrl) {
                    $bucket = env('SUPABASE_AVATARS_BUCKET', 'avatars');
                    $oldPath = str_replace($baseUrl . '/' . $bucket . '/', '', $user->avatar_url);
                    Storage::disk('supabase_avatars')->delete($oldPath);
                }
            }
        }

        // 4. Upload and Get URL dynamically
        if (env('SUPABASE_STORAGE_KEY')) {
            Storage::disk('supabase_avatars')->put($storagePath, (string) $encodedImage);
            $avatarUrl = env('SUPABASE_STORAGE_URL') . '/' . env('SUPABASE_AVATARS_BUCKET', 'avatars') . '/' . $storagePath;
        } else {
            Storage::disk('public')->put($storagePath, (string) $encodedImage);
            $avatarUrl = config('app.url') . Storage::url($storagePath);
        }

        // 5. Update user profile
        $user->update(['avatar_url' => $avatarUrl]);

        return response()->json([
            'status'     => 'success',
            'message'    => 'Avatar berhasil diperbarui!',
            'avatar_url' => $avatarUrl,
        ]);
    }

    /**
     * POST /api/profiles/signature
     * Upload and update user digital signature.
     */
    public function uploadSignature(Request $request)
    {
        $request->validate([
            'signature' => 'required|image|mimes:png|max:2048',
        ]);

        $user = Auth::user();
        $file = $request->file('signature');

        // Compress / decode image
        $manager      = new ImageManager(new Driver());
        $image        = $manager->read($file);
        
        // Scale down, say, max width/height 600px
        if ($image->width() > 600 || $image->height() > 400) {
            $image->scaleDown(width: 600, height: 400);
        }

        $encodedImage = $image->encode(new PngEncoder());
        $filename     = 'signature_' . $user->id . '_' . time() . '.png';
        $storagePath  = 'signatures/' . $filename;

        // Delete old signature
        if ($user->signature_url) {
            if (str_contains($user->signature_url, '/storage/')) {
                $oldPath = str_replace('/storage/', '', parse_url($user->signature_url, PHP_URL_PATH));
                Storage::disk('public')->delete($oldPath);
            } else {
                $baseUrl = env('SUPABASE_STORAGE_URL');
                if ($baseUrl) {
                    $bucket = env('SUPABASE_AVATARS_BUCKET', 'avatars');
                    $oldPath = str_replace($baseUrl . '/' . $bucket . '/', '', $user->signature_url);
                    Storage::disk('supabase_avatars')->delete($oldPath);
                }
            }
        }

        // Upload and Get URL dynamically
        if (env('SUPABASE_STORAGE_KEY')) {
            Storage::disk('supabase_avatars')->put($storagePath, (string) $encodedImage);
            $signatureUrl = env('SUPABASE_STORAGE_URL') . '/' . env('SUPABASE_AVATARS_BUCKET', 'avatars') . '/' . $storagePath;
        } else {
            Storage::disk('public')->put($storagePath, (string) $encodedImage);
            $signatureUrl = config('app.url') . Storage::url($storagePath);
        }

        $user->update(['signature_url' => $signatureUrl]);

        return response()->json([
            'status'        => 'success',
            'message'       => 'Tanda tangan digital berhasil diperbarui!',
            'signature_url' => $user->signature_url,
        ]);
    }

    /**
     * POST /api/profiles/stamp
     * Upload and update user stamp (Superadmin only).
     */
    public function uploadStamp(Request $request)
    {
        $user = Auth::user();
        if ($user->role !== 'super_admin') {
            return response()->json(['status' => 'error', 'message' => 'Hanya Superadmin yang dapat mengunggah stempel.'], 403);
        }

        $request->validate([
            'stamp' => 'required|image|mimes:png|max:2048',
        ]);

        $file = $request->file('stamp');

        // Compress / decode image
        $manager      = new ImageManager(new Driver());
        $image        = $manager->read($file);
        
        // Scale down, say, max 400x400
        if ($image->width() > 400 || $image->height() > 400) {
            $image->scaleDown(width: 400, height: 400);
        }

        $encodedImage = $image->encode(new PngEncoder());
        $filename     = 'stamp_' . $user->id . '_' . time() . '.png';
        $storagePath  = 'stamps/' . $filename;

        // Delete old stamp
        if ($user->stamp_url) {
            if (str_contains($user->stamp_url, '/storage/')) {
                $oldPath = str_replace('/storage/', '', parse_url($user->stamp_url, PHP_URL_PATH));
                Storage::disk('public')->delete($oldPath);
            } else {
                $baseUrl = env('SUPABASE_STORAGE_URL');
                if ($baseUrl) {
                    $bucket = env('SUPABASE_AVATARS_BUCKET', 'avatars');
                    $oldPath = str_replace($baseUrl . '/' . $bucket . '/', '', $user->stamp_url);
                    Storage::disk('supabase_avatars')->delete($oldPath);
                }
            }
        }

        // Upload and Get URL dynamically
        if (env('SUPABASE_STORAGE_KEY')) {
            Storage::disk('supabase_avatars')->put($storagePath, (string) $encodedImage);
            $stampUrl = env('SUPABASE_STORAGE_URL') . '/' . env('SUPABASE_AVATARS_BUCKET', 'avatars') . '/' . $storagePath;
        } else {
            Storage::disk('public')->put($storagePath, (string) $encodedImage);
            $stampUrl = config('app.url') . Storage::url($storagePath);
        }

        $user->update(['stamp_url' => $stampUrl]);

        return response()->json([
            'status'    => 'success',
            'message'   => 'Stempel berhasil diperbarui!',
            'stamp_url' => $user->stamp_url,
        ]);
    }
}

