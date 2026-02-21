<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Shift extends Model
{
    protected $fillable = ['nama_shift'];

    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function masterTemplates()
    {
        return $this->hasMany(MasterTemplate::class);
    }
}
