<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Whiteboard extends Model
{
    use HasUuids;

    const CREATED_AT = null;
    const UPDATED_AT = 'updated_at';

    protected $table = 'whiteboard';

    protected $fillable = [
        'title',
        'content',
        'category',
        'division_id',
        'created_by',
    ];

    public function division()
    {
        return $this->belongsTo(Division::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
