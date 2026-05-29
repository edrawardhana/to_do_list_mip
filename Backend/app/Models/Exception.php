<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Exception extends Model
{
    use HasUuids;

    public $timestamps = false; // ERD has created_at, processed_at (no updated_at)

    protected $fillable = [
        'user_id',
        'evaluated_by',
        'permission_date',
        'replacement_date',
        'type', // sakit, izin, tugas_luar, swap_shift
        'evidence_url',
        'description',
        'status', // pending, approved, rejected
        'manager_approved_by',
        'manager_approved_at',
        'spv_approved_by',
        'spv_approved_at',
        'created_at',
        'processed_at'
    ];

    protected $casts = [
        'permission_date' => 'date',
        'replacement_date' => 'date',
        'manager_approved_at' => 'datetime',
        'spv_approved_at' => 'datetime',
        'created_at' => 'datetime',
        'processed_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function evaluator()
    {
        return $this->belongsTo(User::class, 'evaluated_by');
    }

    public function managerApproval()
    {
        return $this->belongsTo(User::class, 'manager_approved_by');
    }

    public function spvApproval()
    {
        return $this->belongsTo(User::class, 'spv_approved_by');
    }
}
