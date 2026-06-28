<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Exception extends Model
{
    use HasUuids;

    public $timestamps = false; // ERD has created_at, processed_at (no updated_at)

    protected $fillable = [
        'user_id',
        'evaluated_by',
        'permission_date',
        'replacement_date',
        'type', // sakit, izin, tugas_luar, swap_shift
        'evidence_url',
        'description',
        'status', // pending, approved, rejected
        'manager_approved_by',
        'manager_approved_at',
        'spv_approved_by',
        'spv_approved_at',
        'created_at',
        'processed_at'
    ];

    protected $casts = [
        'permission_date' => 'date',
        'replacement_date' => 'date',
        'manager_approved_at' => 'datetime',
        'spv_approved_at' => 'datetime',
        'created_at' => 'datetime',
        'processed_at' => 'datetime',
    ];

    /**
     * GETTER: dynamically generate a secure temporary S3 pre-signed URL if evidence_url is stored in Supabase
     * and bucket is set to PRIVATE. Otherwise, returns as-is for local development compatibility.
     */
    public function getEvidenceUrlAttribute(?string $value): ?string
    {
        if (!$value) return null;

        // If it is a Supabase S3 URL, generate a secure pre-signed S3 URL valid for 20 minutes
        if (env('SUPABASE_STORAGE_KEY')) {
            $baseUrl = env('SUPABASE_STORAGE_URL');
            $bucket = env('SUPABASE_STORAGE_BUCKET', 'evidences');
            
            if (str_contains($value, $baseUrl)) {
                // Extract the clean relative storage path
                $storagePath = str_replace($baseUrl . '/' . $bucket . '/', '', $value);
                
                try {
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

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function evaluator()
    {
        return $this->belongsTo(User::class, 'evaluated_by');
    }

    public function managerApproval()
    {
        return $this->belongsTo(User::class, 'manager_approved_by');
    }

    public function spvApproval()
    {
        return $this->belongsTo(User::class, 'spv_approved_by');
    }
}
