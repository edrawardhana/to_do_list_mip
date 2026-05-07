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
        'assigned_by',
        'task_date',
        'evidence_url',
        'description',
        'confirmed_participants',
        'status', // pending, approved, rejected, revision
        'reject_reason',
        'is_archived',
        'captured_at',
        'assign_note',
    ];

    protected $casts = [
        // confirmed_participants is NOT here — handled by mutator/accessor below
        // Adding 'array' cast here would override the mutator and break PostgreSQL jsonb binding
        'is_archived' => 'boolean',
        'task_date'   => 'date',
        'captured_at' => 'datetime',
    ];

    /**
     * SETTER: encode ke JSON string sebelum disimpan.
     * Kolom bertipe jsonb — PDO butuh string JSON yang valid,
     * bukan PHP array mentah (yang akan di-bind sebagai text[] oleh driver).
     */
    public function setConfirmedParticipantsAttribute(mixed $value): void
    {
        if (is_null($value)) {
            $this->attributes['confirmed_participants'] = json_encode([]);
            return;
        }
        if (is_string($value)) {
            $decoded = json_decode($value, true);
            $this->attributes['confirmed_participants'] = json_encode(
                is_array($decoded) ? array_values($decoded) : []
            );
            return;
        }
        $arr = is_object($value) && method_exists($value, 'toArray')
            ? $value->toArray()
            : (array) $value;
        $this->attributes['confirmed_participants'] = json_encode(array_values($arr));
    }

    /**
     * GETTER: selalu kembalikan PHP array.
     */
    public function getConfirmedParticipantsAttribute(mixed $value): array
    {
        if (is_null($value) || $value === '') return [];
        if (is_array($value)) return $value;
        $decoded = json_decode($value, true);
        return is_array($decoded) ? $decoded : [];
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploader_id');
    }

    public function evaluator()
    {
        return $this->belongsTo(User::class, 'evaluated_by');
    }

    public function assignedBy()
    {
        return $this->belongsTo(User::class, 'assigned_by');
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
