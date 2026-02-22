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

        // Kumpulkan semua kandidat IP dari berbagai sumber
        $candidates = [
            $request->ip(),
            $request->header('X-Real-IP'),
            $request->header('CF-Connecting-IP'),
            $request->header('X-Public-IP'),
        ];

        // Tambahkan IP dari X-Forwarded-For jika ada
        if ($request->header('X-Forwarded-For')) {
            $ips = explode(',', $request->header('X-Forwarded-For'));
            foreach ($ips as $ip) {
                $candidates[] = trim($ip);
            }
        }

        // Bersihkan null dan duplikat
        $candidates = array_unique(array_filter($candidates));

        // Cek apakah salah satu kandidat ada di dalam whitelist
        $isAllowed = false;
        $matchedIp = null;
        foreach ($candidates as $ip) {
            if (in_array($ip, $allowedIps)) {
                $isAllowed = true;
                $matchedIp = $ip;
                break;
            }
        }

        if (!$isAllowed) {
            // Gunakan IP publik (jika ada) atau IP terdeteksi pertama untuk pesan error
            $displayIp = $request->header('X-Public-IP') ?? $request->header('X-Real-IP') ?? $request->ip();
            
            return response()->json([
                'message' => 'Akses ditolak. IP Anda (' . $displayIp . ') tidak terdaftar di WiFi MCC.',
                'debug_info' => [
                    'all_detected_ips' => $candidates,
                    'allowed_ips' => $allowedIps
                ]
            ], 403);
        }

        return $next($request);
    }
}
