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

    public function actor()
    {
        return $this->belongsTo(User::class, 'actor_id');
    }

    /**
     * Universal helper to record actions easily across all controllers
     */
    public static function record($actor_id, $action_type, $details, $target_id = null)
    {
        self::create([
            'actor_id' => $actor_id,
            'target_id' => $target_id,
            'action_type' => $action_type,
            'details' => $details,
            'created_at' => now(),
        ]);
    }
}
