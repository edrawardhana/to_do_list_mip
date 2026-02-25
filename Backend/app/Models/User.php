<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Tymon\JWTAuth\Contracts\JWTSubject;

class User extends Authenticatable implements JWTSubject
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

    // Mengembalikan identifier unik user untuk JWT
    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    // Mengembalikan klaim kustom tambahan untuk JWT
    public function getJWTCustomClaims(): array
    {
        return [];
    }
}
