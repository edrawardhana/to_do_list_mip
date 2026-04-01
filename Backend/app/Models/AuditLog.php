<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    use HasUuids;

    public $timestamps = false;

    protected $fillable = [
        'admin_id',
        'actor_role',
        'target_user_id',
        'action',
        'old_values',
        'new_values',
        'created_at'
    ];

    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array',
        'created_at' => 'datetime',
    ];

    // Relasi ke User yang melakukan aksi
    public function actor()
    {
        return $this->belongsTo(User::class, 'admin_id');
    }

    // Relasi ke User yang menjadi target aksi
    public function target()
    {
        return $this->belongsTo(User::class, 'target_user_id');
    }

    /**
     * GHOST PROTECTION: Melarang penghapusan log dari level Laravel ORM
     */
    public function delete()
    {
        throw new \RuntimeException('GHOST LOCK: Audit Log bersifat permanen dan tidak dapat dihapus.');
    }

    /**
     * GHOST PROTECTION: Melarang modifikasi log dari level Laravel ORM
     */
    public function update(array $attributes = [], array $options = [])
    {
        throw new \RuntimeException('GHOST LOCK: Audit Log tidak dapat dimodifikasi setelah tercatat.');
    }

    /**
     * Universal helper to record actions easily across all controllers
     */
    public static function record($admin_id, $actor_role, $action, $new_values = null, $old_values = null, $target_user_id = null)
    {
        // Menggunakan parent::query()->create() agar bypass override update/delete
        self::query()->create([
            'admin_id' => $admin_id,
            'actor_role' => $actor_role,
            'target_user_id' => $target_user_id,
            'action' => $action,
            'old_values' => $old_values,
            'new_values' => $new_values,
            'created_at' => now(),
        ]);
    }
}
