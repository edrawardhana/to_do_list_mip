<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class AuthController extends Controller
{
    /**
     * Login dan dapatkan JWT token.
     */
    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        // Cari user berdasarkan email
        $user = User::where('email', $request->email)->first();

        // Cek apakah user ada dan password cocok
        if (!$user || !Hash::check($request->password, $user->password_hash)) {
            return response()->json(['message' => 'Email atau password salah.'], 401);
        }

        // Cek apakah akun terkunci
        if ($user->is_locked) {
            return response()->json(['message' => 'Akun Anda terkunci. Hubungi admin.'], 403);
        }

        // Generate JWT token
        $token = Auth::login($user);

        return $this->respondWithToken($token);
    }

    /**
     * Dapatkan data user yang sedang login beserta divisi.
     */
    public function me()
    {
        $user = Auth::user()->load('division');

        return response()->json($user);
    }

    /**
     * Logout dan invalidasi JWT token.
     */
    public function logout()
    {
        Auth::logout();

        return response()->json(['message' => 'Logout berhasil.']);
    }

    /**
     * Refresh JWT token yang sudah hampir expired.
     */
    public function refresh()
    {
        return $this->respondWithToken(Auth::refresh());
    }

    /**
     * Format response token.
     */
    protected function respondWithToken(string $token): \Illuminate\Http\JsonResponse
    {
        return response()->json([
            'access_token' => $token,
            'token_type'   => 'bearer',
            'expires_in'   => Auth::factory()->getTTL() * 60,
        ]);
    }
}
