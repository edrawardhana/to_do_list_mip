<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class DailyTask extends Model
{
    use HasUuids;

    public $timestamps = true; // ERD V3 has created_at, updated_at

    protected $fillable = [
        'template_id',
        'uploader_id',
        'division_id',
        'evaluated_by',
        'task_date',
        'evidence_url',
        'description',
        'confirmed_participants',
        'status', // pending, approved, rejected, revision
        'reject_reason',
        'is_archived',
        'captured_at',
    ];

    protected $casts = [
        'confirmed_participants' => 'array',
        'is_archived' => 'boolean',
        'task_date' => 'date',
        'captured_at' => 'datetime',
    ];

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploader_id');
    }

    public function evaluator()
    {
        return $this->belongsTo(User::class, 'evaluated_by');
    }

    public function division()
    {
        return $this->belongsTo(Division::class);
    }

    public function taskTemplate()
    {
        return $this->belongsTo(TaskTemplate::class, 'template_id');
    }
}
