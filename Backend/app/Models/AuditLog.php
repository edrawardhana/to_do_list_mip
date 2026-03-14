<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    use HasUuids;

    public $timestamps = false;

    protected $fillable = [
        'actor_id',
        'target_id',
        'action_type',
        'details',
        'created_at'
    ];

    // Relasi ke User yang melakukan aksi
    public function actor()
    {
        return $this->belongsTo(User::class, 'actor_id');
    }

    // Relasi ke User yang menjadi target aksi
    public function target()
    {
        return $this->belongsTo(User::class, 'target_id');
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
    public static function record($actor_id, $action_type, $details, $target_id = null)
    {
        // Menggunakan parent::query()->create() agar bypass override update/delete
        self::query()->create([
            'actor_id' => $actor_id,
            'target_id' => $target_id,
            'action_type' => $action_type,
            'details' => $details,
            'created_at' => now(),
        ]);
    }
}
