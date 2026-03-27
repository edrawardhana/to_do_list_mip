<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Schedule extends Model
{
    use HasUuids;

    public $timestamps = false; // Based on ERD, only has created_at
    const UPDATED_AT = null;

    protected $fillable = [
        'user_id',
        'shift_date',
        'shift_type', // morning, afternoon, full
        'created_at',
    ];

    protected $casts = [
        'shift_date' => 'date',
        'created_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
