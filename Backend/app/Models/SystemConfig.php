<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SystemConfig extends Model
{
    // Special PK for SystemConfig is 'key' which is a string
    protected $primaryKey = 'key';
    public $incrementing = false;
    protected $keyType = 'string';

    public $timestamps = false; // Only updated_at exists, so standard timestamps are false

    protected $fillable = [
        'key',
        'value',
        'updated_at',
    ];

    protected $casts = [
        'updated_at' => 'datetime',
    ];
}
