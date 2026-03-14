<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DivisionController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\DailyTaskController;
use App\Http\Controllers\WhiteboardController;
use App\Http\Controllers\TaskTemplateController;
use App\Http\Controllers\AuditLogController;
use App\Http\Controllers\ProfileController;

// Endpoint publik (Bisa diakses tanpa login)
Route::get('/divisions', [DivisionController::class, 'index']);

Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);

    Route::middleware('auth:api')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);

        // Attendance Routes (Izin, Sakit, Swap, Libur)
        Route::apiResource('attendance', AttendanceController::class)->except(['show']);

        // Daily Task (Logbook) Routes
        Route::apiResource('daily-tasks', DailyTaskController::class)->except(['show']);

        // Whiteboard Routes
        Route::apiResource('whiteboards', WhiteboardController::class)->except(['show']);

        // Task Template Routes (Admin/Superadmin)
        Route::apiResource('task-templates', TaskTemplateController::class)->except(['show']);

        // Audit Logs (Superadmin/Admin)
        Route::get('/audit-logs', [AuditLogController::class, 'index']);

        // Employee/Profile Management (List for tagging, Update for Approval)
        Route::apiResource('profiles', ProfileController::class)->only(['index', 'update']);
    });
});

