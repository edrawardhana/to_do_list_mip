<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CheckAccountLock
{
    public function handle(Request $request, Closure $next)
    {
        // Kalau user udah login TAPI akunnya dikunci, tendang pake error 423
        if (Auth::check() && Auth::user()->is_locked) {
            return response()->json([
                'status' => 'error',
                'message' => 'Akun dibekukan oleh sistem.',
                'is_locked' => true
            ], 423); // 423 = HTTP Status "Locked"
        }

        return $next($request);
    }
}