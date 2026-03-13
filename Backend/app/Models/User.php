<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use PHPOpenSourceSaver\JWTAuth\Contracts\JWTSubject;

class User extends Authenticatable implements JWTSubject
{
    use HasFactory, HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $table = 'profiles'; // Mapped to profiles table
    public $timestamps = false; // ERD has no created/updated_at for profiles

    protected $fillable = [
        'full_name',
        'username',
        'email',
        'password_hash',
        'division_id',
        'role',
        'shift',
        'is_locked'
    ];

    protected $hidden = [
        'password_hash',
        'remember_token',
    ];

    public function getAuthPasswordName()
{
    return 'password_hash';
}

    public function getAuthPassword()
    {
        return $this->password_hash;
    }

    public function division()
    {
        return $this->belongsTo(Division::class);
    }

    protected function casts(): array
    {
        return [
            'is_locked' => 'boolean',
            'email_verified_at' => 'datetime',
        ];
    }

    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims()
    {
        return [];
    }

}
