<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;

class User extends Authenticatable
{
    use HasFactory, HasUuids;

    protected $table = 'profiles'; // Mapped to profiles table
    public $timestamps = false; // ERD has no created/updated_at for profiles

    protected $fillable = [
        'division_id',
        'full_name',
        'email',
        'password_hash',
        'role',
        'shift',
        'is_locked',
    ];

    protected $hidden = [
        'password_hash',
    ];

    public function getAuthPassword()
    {
        return $this->password_hash;
    }

    protected function casts(): array
    {
        return [
            'is_locked' => 'boolean',
        ];
    }

    public function division()
    {
        return $this->belongsTo(Division::class);
    }
}
