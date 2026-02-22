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
        // Izinkan preflight request (CORS) tanpa cek IP
        if ($request->isMethod('OPTIONS')) {
            return $next($request);
        }

        // Ambil daftar IP yang diizinkan dari .env, dipisahkan koma
        $allowedIpsStr = env('ALLOWED_IPS', '127.0.0.1');
        $allowedIps = array_map('trim', explode(',', $allowedIpsStr));

        // Jika ALLOWED_IPS adalah '*', maka izinkan semua (untuk testing)
        if (in_array('*', $allowedIps)) {
            return $next($request);
        }

        $clientIp = $request->ip();
        
        // Cek header khusus jika ada (X-Real-IP dari Zeabur atau CF-Connecting-IP)
        $realIp = $request->header('X-Real-IP') ?? $request->header('CF-Connecting-IP') ?? $clientIp;

        // Cek apakah IP pengakses ada di dalam whitelist
        if (!in_array($clientIp, $allowedIps) && !in_array($realIp, $allowedIps)) {
            return response()->json([
                'message' => 'Akses ditolak. IP Anda (' . $realIp . ') tidak terdaftar di WiFi MCC.',
                'debug_info' => [
                    'detected' => $clientIp,
                    'real' => $realIp
                ]
            ], 403);
        }

        return $next($request);
    }
}
