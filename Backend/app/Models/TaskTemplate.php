<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class TaskTemplate extends Model
{
    use HasUuids;

    public $timestamps = true; // Based on ERD, only has created_at
    const UPDATED_AT = null;

    protected $fillable = [
        'division_id',
        'title',
        'description',
        'is_active',
        'created_at',
        'start_time',    // Format HH:MM WIB — waktu mulai intern boleh mengerjakan
        'end_time',      // Format HH:MM WIB — batas akhir pengiriman laporan
        'reminder_time', // Format HH:MM WIB — jam notifikasi pengingat otomatis
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'created_at' => 'datetime',
    ];

    public function division()
    {
        return $this->belongsTo(Division::class);
    }

    /**
     * Determine if a template's start_time belongs to a specific shift type.
     */
    public static function matchesShift(?string $startTime, string $shiftType): bool
    {
        if ($shiftType === 'full') {
            return true;
        }

        if (!$startTime) {
            return true; // Default if template has no start_time defined
        }

        // Clean start_time to HH:MM format
        $startTime = substr(trim($startTime), 0, 5);
        if (!preg_match('/^\d{2}:\d{2}$/', $startTime)) {
            return true; // Fallback if format is invalid
        }

        // Convert HH:MM to minutes from midnight
        list($hours, $minutes) = explode(':', $startTime);
        $totalMinutes = ($hours * 60) + $minutes;

        switch ($shiftType) {
            case 'morning':
                // Pagi: 08:00 - 15:00 WIB (matches tasks starting between 08:00 and 10:00 exclusive)
                return $totalMinutes >= 480 && $totalMinutes < 600;

            case 'middle':
                // Middle: 10:00 - 17:00 WIB (matches tasks starting between 10:00 and 15:00 exclusive)
                return $totalMinutes >= 600 && $totalMinutes < 900;

            case 'afternoon':
                // Sore: 15:00 - 22:00 WIB (matches tasks starting at or after 15:00)
                return $totalMinutes >= 900 || $totalMinutes < 480;

            default:
                return true;
        }
    }
}
