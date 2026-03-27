<?php

namespace App\Http\Controllers;

use App\Models\SystemConfig;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\AuditLog;

class SystemConfigController extends Controller
{
    /**
     * Get list of all system configs (e.g., lock_time_start)
     */
    public function index()
    {
        // Settings depend on business logic. Usually accessible by all authenticated users to know rules,
        // or just admins. For now, we allow all authenticated users to read settings.
        $configs = SystemConfig::all();

        return response()->json([
            'status' => 'success',
            'data' => $configs
        ]);
    }

    /**
     * Update a system configuration (Super Admin or Admin only)
     * e.g. PUT /api/system-configs/lock_time_start
     */
    public function update(Request $request, $key)
    {
        $user = Auth::user();

        // Only Admin or Super Admin can change global settings
        if ($user->role === 'intern') {
            return response()->json(['status' => 'error', 'message' => 'Hanya Admin/HR yang bisa mengubah konfigurasi sistem.'], 403);
        }

        $config = SystemConfig::where('key', $key)->firstOrFail();
        $old_values = $config->toArray();

        $request->validate([
            'value' => 'required|string'
        ]);

        // Using update method won't work perfectly on non-incrementing string PKs unless defined properly in Model.
        // We defined it in SystemConfig.php, so this should work.
        $config->update([
            'value' => $request->value,
            'updated_at' => now()
        ]);

        AuditLog::record($user->id, $user->role, 'Ubah Konfigurasi Sistem', $config->fresh()->toArray(), $old_values);

        return response()->json([
            'status' => 'success',
            'message' => "Konfigurasi '{$key}' berhasil diperbarui.",
            'data' => $config
        ]);
    }
}
