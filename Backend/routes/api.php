<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DivisionController;
use App\Http\Controllers\ExceptionController;
use App\Http\Controllers\DailyTaskController;
use App\Http\Controllers\WhiteboardAIController;
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
use App\Http\Controllers\LogbookAIController; // ← TAMBAHAN 1: Import Controller AI

// Endpoint publik (Bisa diakses tanpa login)
Route::get('/divisions', [DivisionController::class, 'index']);

// JWT Auth Endpoints
Route::prefix('auth')->group(function () {
    // ⚠️ Registrasi publik DITUTUP — akun hanya dibuat oleh Superadmin
    Route::post('/login', [AuthController::class, 'login']);

    Route::middleware('auth:api')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::put('/change-password', [AuthController::class, 'changePassword']);
    });
});

// Resources terproteksi dengan JWT Laravel
Route::middleware(['auth:api', \App\Http\Middleware\CheckAccountLock::class])->group(function () {

    // Exception Routes (Sakit, Izin, Tugas Luar, Swap Shift)
    Route::post('/exceptions/{id}/resend-email', [ExceptionController::class, 'resendEmail']);
    Route::apiResource('exceptions', ExceptionController::class)->except(['show']);

    // Daily Task (Logbook) Routes
    // ⚠️ Specific routes MUST be before apiResource to avoid wildcard capture
    Route::post('/logbook/evaluate', [LogbookAIController::class, 'checkLogbook']); // ← TAMBAHAN 2: Endpoint evaluasi AI (Gatekeeper Llama 4 Scout)
    Route::post('/daily-tasks/assign', [DailyTaskController::class, 'assignTask']);
    Route::post('/daily-tasks/{id}/submit', [DailyTaskController::class, 'submit']);
    Route::put('/daily-tasks/{id}/confirm', [DailyTaskController::class, 'confirm']);  // ← Tugas Bersama: ACC
    Route::put('/daily-tasks/{id}/reject', [DailyTaskController::class, 'reject']);    // ← Tugas Bersama: Tolak
    Route::apiResource('daily-tasks', DailyTaskController::class)->except(['show']);

    // Whiteboard Routes
    Route::apiResource('whiteboards', WhiteboardController::class)->except(['show']);
    Route::post('/whiteboards/breakdown', [WhiteboardAIController::class, 'generateBreakdown']);
    Route::post('/whiteboards/ask', [WhiteboardAIController::class, 'askAssistant']);

    // Task Template Routes (Admin/Superadmin)
    Route::apiResource('task-templates', TaskTemplateController::class)->except(['show']);

    // Audit Logs (Superadmin/Admin)
    Route::get('/audit-logs', [AuditLogController::class, 'index']);

    // Employee/Profile Management
    Route::get('/profiles/secure-image', [ProfileController::class, 'secureImage']);
    Route::post('/profiles/avatar', [ProfileController::class, 'uploadAvatar']);
    Route::post('/profiles/signature', [ProfileController::class, 'uploadSignature']);
    Route::post('/profiles/stamp', [ProfileController::class, 'uploadStamp']);
    Route::post('/profiles/fcm-token', [ProfileController::class, 'updateFcmToken']);
    Route::get('/profiles/template-csv', [ProfileController::class, 'downloadTemplateCsv']); // ← Download template CSV
    Route::post('/profiles/download-user-detail', [ProfileController::class, 'downloadUserDetail']); // ← Download detail user baru
    Route::post('/profiles/store-manual', [ProfileController::class, 'storeManual']);   // ← Buat akun manual
    Route::post('/profiles/import-csv', [ProfileController::class, 'importCsv']);       // ← Impor CSV massal
    Route::post('/profiles/bulk-lock', [ProfileController::class, 'bulkLock']);         // ← Kunci massal
    Route::post('/profiles/bulk-destroy', [ProfileController::class, 'bulkDestroy']);   // ← Hapus massal
    Route::post('/profiles/bulk-reset-password', [ProfileController::class, 'bulkResetPassword']); // ← Reset password massal
    Route::post('/profiles/{id}/reset-password', [ProfileController::class, 'resetPassword']); // ← Reset password
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

    // Reports & Analytics
    Route::get('/reports/monthly', [ReportController::class, 'monthly']);

    // ⚠️ Housekeeping routes DIHAPUS — data cleanup berjalan otomatis via scheduler
});