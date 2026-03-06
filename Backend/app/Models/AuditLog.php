<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    use HasUuids;

    public $timestamps = false;
    const CREATED_AT = 'created_at';

    protected $fillable = [
        'actor_id',
        'target_id',
        'action_type',
        'details',
    ];

    public function actor()
    {
        return $this->belongsTo(User::class, 'actor_id');
    }
}
