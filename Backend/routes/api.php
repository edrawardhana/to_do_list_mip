<?php

use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;

// Endpoint login, tidak perlu autentikasi
Route::post('/login', [AuthController::class, 'login']);
Route::get('/test-api', function() { return response()->json(['status' => 'OK']); });
Route::get('/check-ip', function(\Illuminate\Http\Request $request) { 
    return response()->json([
        'detected_ip' => $request->ip(),
        'all_ips' => $request->ips(),
        'header_x_forwarded' => $request->header('X-Forwarded-For')
    ]); 
});

// Endpoint yang memerlukan JWT token
Route::middleware('auth:api')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/refresh', [AuthController::class, 'refresh']);
    Route::get('/me', [AuthController::class, 'me']);

    // Absen / Daily Tasks
    Route::get('/daily-tasks', [\App\Http\Controllers\DailyTaskController::class, 'index']);
    Route::patch('/daily-tasks/{id}', [\App\Http\Controllers\DailyTaskController::class, 'update']);
});
