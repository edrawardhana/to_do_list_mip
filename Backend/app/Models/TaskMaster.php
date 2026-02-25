<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class TaskMaster extends Model
{
    use HasUuids;

    public $timestamps = false;

    protected $table = 'tasks_master';

    protected $fillable = [
        'division_id',
        'task_name',
        'description',
    ];

    public function division()
    {
        return $this->belongsTo(Division::class);
    }

    public function logbookEntries()
    {
        return $this->hasMany(LogbookEntry::class, 'task_id');
    }
}
