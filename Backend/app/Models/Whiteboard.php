<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Whiteboard extends Model
{
    use HasUuids;

    public $timestamps = false;

    protected $fillable = [
        'division_id',
        'title',
        'content_url',
        'type', // SOP, Tutorial, Asset
    ];

    public function division()
    {
        return $this->belongsTo(Division::class);
    }
}
