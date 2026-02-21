<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RestrictIpMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Ambil daftar IP yang diizinkan dari .env, dipisahkan koma
        $allowedIpsStr = env('ALLOWED_IPS', '127.0.0.1');
        $allowedIps = array_map('trim', explode(',', $allowedIpsStr));

        // Jika ALLOWED_IPS adalah '*', maka izinkan semua (untuk testing)
        if (in_array('*', $allowedIps)) {
            return $next($request);
        }

        $clientIp = $request->ip();

        // Cek apakah IP pengakses ada di dalam whitelist
        if (!in_array($clientIp, $allowedIps)) {
            return response()->json([
                'message' => 'Akses ditolak. IP Anda (' . $clientIp . ') tidak terdaftar di WiFi MCC.',
            ], 403);
        }

        return $next($request);
    }
}
