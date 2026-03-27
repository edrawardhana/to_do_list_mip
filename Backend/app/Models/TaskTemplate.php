<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class TaskTemplate extends Model
{
    use HasUuids;

    public $timestamps = true; // Based on ERD, only has created_at
    const UPDATED_AT = null;

    protected $fillable = [
        'division_id',
        'title',
        'description',
        'is_active',
        'created_at',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'created_at' => 'datetime',
    ];

    public function division()
    {
        return $this->belongsTo(Division::class);
    }
}
