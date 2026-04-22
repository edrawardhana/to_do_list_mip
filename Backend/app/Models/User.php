<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use PHPOpenSourceSaver\JWTAuth\Contracts\JWTSubject;

class User extends Authenticatable implements JWTSubject
{
    use HasUuids, Notifiable, SoftDeletes;

    // Explicitly define the table name because the model is User but table is profiles
    protected $table = 'profiles';

    // ERD v3: email, username, password_hash restored for Laravel JWT
    protected $fillable = [
        'full_name',
        'nickname',
        'email',
        'username',
        'password_hash',
        'division_id',
        'role',
        'is_verified',
        'is_locked',
        'avatar_url',
        'phone_number',
        'fcm_token'
    ];

    protected $hidden = [
        'password_hash',
    ];

    protected $casts = [
        'is_verified' => 'boolean',
        'is_locked' => 'boolean',
    ];

    /**
     * Map auth password to password_hash
     */
    public function getAuthPassword()
    {
        return $this->password_hash;
    }

    /**
     * Get the identifier that will be stored in the subject claim of the JWT.
     *
     * @return mixed
     */
    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    /**
     * Return a key value array, containing any custom claims to be added to the JWT.
     *
     * @return array
     */
    public function getJWTCustomClaims()
    {
        return [
            'role' => $this->role,
            'division_id' => $this->division_id,
        ];
    }

    // ==========================================
    // Relationships (ERD v3)
    // ==========================================

    public function division()
    {
        return $this->belongsTo(Division::class, 'division_id');
    }

    public function dailyTasks()
    {
        return $this->hasMany(DailyTask::class, 'uploader_id');
    }

    public function evaluatedTasks()
    {
        return $this->hasMany(DailyTask::class, 'evaluated_by');
    }

    public function exceptions()
    {
        return $this->hasMany(Exception::class, 'user_id');
    }

    public function evaluatedExceptions()
    {
        return $this->hasMany(Exception::class, 'evaluated_by');
    }

    public function schedules()
    {
        return $this->hasMany(Schedule::class, 'user_id');
    }

    public function broadcastedMessages()
    {
        return $this->hasMany(Broadcast::class, 'author_id');
    }

    public function notifications()
    {
        return $this->hasMany(Notification::class, 'user_id');
    }

    public function auditLogsAsAdmin()
    {
        return $this->hasMany(AuditLog::class, 'admin_id');
    }

    public function auditLogsAsTarget()
    {
        return $this->hasMany(AuditLog::class, 'target_user_id');
    }
}
