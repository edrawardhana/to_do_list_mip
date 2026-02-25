<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class ShiftSwap extends Model
{
    use HasUuids;

    public $timestamps = false;

    protected $fillable = [
        'requester_id',
        'target_user_id',
        'swap_date',
        'reason_screenshot_url',
        'status',
        'approved_by',
    ];

    protected function casts(): array
    {
        return [
            'swap_date' => 'date',
        ];
    }

    public function requester()
    {
        return $this->belongsTo(User::class, 'requester_id');
    }

    public function targetUser()
    {
        return $this->belongsTo(User::class, 'target_user_id');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
