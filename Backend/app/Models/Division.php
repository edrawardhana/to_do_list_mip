<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Division extends Model
{
    use HasUuids;

    public $timestamps = true; // Based on ERD, only has created_at
    const UPDATED_AT = null;

    protected $fillable = [
        'name',
        'description',
        'created_at',
    ];

    protected $casts = [
        'created_at' => 'datetime',
    ];

    public function profiles()
    {
        return $this->hasMany(User::class, 'division_id');
    }

    public function taskTemplates()
    {
        return $this->hasMany(TaskTemplate::class);
    }
}
