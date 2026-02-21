<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OffSchedule extends Model
{
    protected $fillable = [
        'user_id',
        'tanggal_off',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
