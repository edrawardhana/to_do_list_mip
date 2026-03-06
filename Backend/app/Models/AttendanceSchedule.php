<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class AttendanceSchedule extends Model
{
    use HasUuids;

    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'type', // Izin, Sakit, Swap, Libur
        'start_date',
        'end_date',
        'proof_url',
        'is_approved',
    ];

    protected function casts(): array
    {
        return [
            'is_approved' => 'boolean',
            'start_date' => 'date',
            'end_date' => 'date',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
