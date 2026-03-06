<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class TaskTemplate extends Model
{
    use HasUuids;

    public $timestamps = false;

    protected $fillable = [
        'division_id',
        'task_name',
    ];

    public function division()
    {
        return $this->belongsTo(Division::class);
    }
}
