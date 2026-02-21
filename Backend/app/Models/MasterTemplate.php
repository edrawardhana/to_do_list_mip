<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MasterTemplate extends Model
{
    protected $fillable = [
        'shift_id',
        'nama_kegiatan',
        'estimasi_waktu',
    ];

    public function shift()
    {
        return $this->belongsTo(Shift::class);
    }
}
