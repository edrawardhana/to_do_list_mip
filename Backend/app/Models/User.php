<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;

class User extends Authenticatable
{
    use HasFactory, HasUuids;

    public $timestamps = false;

    const CREATED_AT = 'created_at';

    protected $fillable = [
        'full_name',
        'email',
        'password_hash',
        'role',
        'division_id',
        'shift_type',
        'is_locked',
        'status',
    ];

    protected $hidden = [
        'password_hash',
    ];

    protected function casts(): array
    {
        return [
            'is_locked' => 'boolean',
        ];
    }

    /**
     * Override kolom password untuk auth Laravel.
     */
    public function getAuthPassword()
    {
        return $this->password_hash;
    }

    // Relasi ke division
    public function division()
    {
        return $this->belongsTo(Division::class);
    }
}
