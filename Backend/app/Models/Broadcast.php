<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Broadcast extends Model
{
    use HasUuids;

    public $timestamps = false;

    protected $fillable = [
        'author_id', // Super Admin ID
        'title',
        'content',
        'category', // info, urgent
        'target_label', // 🔥 INI DIA YANG BIKIN NYASAR! Sekarang udah masuk jalur VIP.
        'expires_at',
        'created_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'created_at' => 'datetime',
    ];

    public function author()
    {
        return $this->belongsTo(User::class, 'author_id');
    }
}