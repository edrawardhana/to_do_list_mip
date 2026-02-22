<?php

use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;

// Endpoint login, tidak perlu autentikasi
Route::post('/login', [AuthController::class, 'login']);

// Endpoint yang memerlukan JWT token
Route::middleware('auth:api')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/refresh', [AuthController::class, 'refresh']);
    Route::get('/me', [AuthController::class, 'me']);

    // Absen / Daily Tasks
    Route::get('/daily-tasks', [\App\Http\Controllers\DailyTaskController::class, 'index']);
    Route::patch('/daily-tasks/{id}', [\App\Http\Controllers\DailyTaskController::class, 'update']);
});
