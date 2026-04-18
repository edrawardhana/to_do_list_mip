<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DivisionController;
use App\Http\Controllers\ExceptionController;
use App\Http\Controllers\DailyTaskController;
use App\Http\Controllers\WhiteboardController;
use App\Http\Controllers\TaskTemplateController;
use App\Http\Controllers\AuditLogController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\BroadcastController;
use App\Http\Controllers\ScheduleController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\SystemConfigController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\SuperadminDashboardController;
use App\Http\Controllers\AdminDashboardController;
use App\Http\Controllers\InternDashboardController;

// Endpoint publik (Bisa diakses tanpa login)
Route::get('/divisions', [DivisionController::class, 'index']);

// JWT Auth Endpoints
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);

    // Endpoint terproteksi dengan JWT Laravel
    Route::middleware('auth:api')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
    });
});

// Resources terproteksi dengan JWT Laravel
Route::middleware('auth:api')->group(function () {
    
    // Exception Routes (Sakit, Izin, Tugas Luar, Swap Shift) -- Pengganti Attendance
    Route::apiResource('exceptions', ExceptionController::class)->except(['show']);

    // Daily Task (Logbook) Routes
    // ⚠️ Submit route MUST be before apiResource so it's not captured by {id} wildcard
    Route::post('/daily-tasks/{id}/submit', [DailyTaskController::class, 'submit']);
    Route::apiResource('daily-tasks', DailyTaskController::class)->except(['show']);


    // Whiteboard Routes
    Route::apiResource('whiteboards', WhiteboardController::class)->except(['show']);

    // Task Template Routes (Admin/Superadmin)
    Route::apiResource('task-templates', TaskTemplateController::class)->except(['show']);

    // Audit Logs (Superadmin/Admin)
    Route::get('/audit-logs', [AuditLogController::class, 'index']);

    // Employee/Profile Management (List for tagging, Update for Approval)
    Route::apiResource('profiles', ProfileController::class)->only(['index', 'update', 'show', 'destroy']);

    // Schedules (Shift Dinamis)
    Route::apiResource('schedules', ScheduleController::class)->except(['show']);

    // Notifications
    Route::apiResource('notifications', NotificationController::class)->except(['show']);

    // Broadcasts (Superadmin)
    Route::get('/broadcasts/history', [BroadcastController::class, 'history']);
    Route::post('/broadcasts/send', [BroadcastController::class, 'send']);
    Route::apiResource('broadcasts', BroadcastController::class)->except(['show']);

    // System Configs (Superadmin/Admin View)
    Route::apiResource('system-configs', SystemConfigController::class)->except(['show']);

    // Administrasi Divisi (Superadmin/Admin View)
    Route::get('/divisions/analytics', [DivisionController::class, 'analytics']);
    Route::apiResource('divisions', DivisionController::class)->except(['index', 'show']);

    // Dashboard Data (Role-specific)
    Route::get('/dashboard/superadmin', [SuperadminDashboardController::class, 'index']);
    Route::get('/dashboard/admin', [AdminDashboardController::class, 'index']);
    Route::get('/dashboard/intern', [InternDashboardController::class, 'index']);

    // Reports & Analytics (Sprint 4)
    Route::get('/reports/monthly', [ReportController::class, 'monthly']);
});

