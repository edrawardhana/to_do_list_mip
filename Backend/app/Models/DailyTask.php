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
        'status', // pending, waiting_confirmation, approved, rejected, revision
        'reject_reason',
        'is_archived',
        'captured_at',
        'assign_note',
        // Mention / Collaboration system
        'parent_task_id',
        'mention_submitted_at',
        'mention_confirmed_at',
        // Submission timestamp
        'submitted_at',
        // Ad-hoc task / time configuration fields
        'due_date',
        'title',
        'start_time',
        'end_time',
        'reminder_time',
    ];

    protected $casts = [
        // confirmed_participants is NOT here — handled by mutator/accessor below
        // Adding 'array' cast here would override the mutator and break PostgreSQL jsonb binding
        'is_archived'           => 'boolean',
        'task_date'             => 'date',
        'captured_at'           => 'datetime',
        'mention_submitted_at'  => 'datetime',
        'mention_confirmed_at'  => 'datetime',
        'submitted_at'          => 'datetime',
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

    /**
     * GETTER: dynamically generate a secure temporary S3 pre-signed URL if evidence_url is stored in Supabase
     * and bucket is set to PRIVATE. Otherwise, returns as-is for local development compatibility.
     */
    public function getEvidenceUrlAttribute(?string $value): ?string
    {
        // If this task is a child task (has parent_task_id) and has no evidence_url of its own,
        // dynamically pull and sign the parent task's evidence_url!
        if (!$value && $this->parent_task_id) {
            $parent = $this->parentTask;
            if ($parent) {
                return $parent->evidence_url;
            }
        }

        if (!$value) return null;

        // If it is a Supabase S3 URL, generate a secure pre-signed S3 URL valid for 20 minutes
        if (env('SUPABASE_STORAGE_KEY')) {
            $baseUrl = env('SUPABASE_STORAGE_URL');
            $bucket = env('SUPABASE_STORAGE_BUCKET', 'evidences');
            
            if (str_contains($value, $baseUrl)) {
                // Extract the clean relative storage path
                $storagePath = str_replace($baseUrl . '/' . $bucket . '/', '', $value);
                
                try {
                    // Cache the pre-signed URL for 15 minutes to eliminate signature generation overhead on every serialization loop.
                    // Since the pre-signed URL is valid for 20 minutes, 15 minutes cache lifetime ensures it remains valid.
                    $cacheKey = 'supabase_signed_url_' . md5($storagePath);
                    return \Illuminate\Support\Facades\Cache::remember($cacheKey, 900, function () use ($storagePath) {
                        return \Illuminate\Support\Facades\Storage::disk('supabase')->temporaryUrl($storagePath, now()->addMinutes(20));
                    });
                } catch (\Exception $e) {
                    return $value;
                }
            }
        }

        // If it's a local public storage URL, return full asset URL if relative
        if (str_contains($value, 'storage/')) {
            return str_starts_with($value, 'http') ? $value : asset($value);
        }

        return $value;
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

    public function parentTask()
    {
        return $this->belongsTo(DailyTask::class, 'parent_task_id');
    }

    public function childTasks()
    {
        return $this->hasMany(DailyTask::class, 'parent_task_id');
    }
}
