<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Division extends Model
{
    use HasUuids;

    public $timestamps = false;

    protected $fillable = [
        'name',
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
