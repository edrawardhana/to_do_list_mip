<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class DailyTask extends Model
{
    use HasUuids;

    public $timestamps = false;
    const CREATED_AT = 'created_at';

    protected $fillable = [
        'user_id',
        'division_id',
        'task_template_id',
        'task_name',
        'evidence_url',
        'status', // pending, approved, rejected
        'first_uploader_id',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function division()
    {
        return $this->belongsTo(Division::class);
    }

    public function taskTemplate()
    {
        return $this->belongsTo(TaskTemplate::class);
    }

    public function firstUploader()
    {
        return $this->belongsTo(User::class, 'first_uploader_id');
    }
}
