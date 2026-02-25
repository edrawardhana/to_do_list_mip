<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class BroadcastMessage extends Model
{
    use HasUuids;

    public $timestamps = false;

    // Nama tabel sesuai ERD
    protected $table = 'broadcasts';

    protected $fillable = [
        'admin_id',
        'target_division_id',
        'message',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'created_at' => 'datetime',
        ];
    }

    public function admin()
    {
        return $this->belongsTo(User::class, 'admin_id');
    }

    public function targetDivision()
    {
        return $this->belongsTo(Division::class, 'target_division_id');
    }
}
