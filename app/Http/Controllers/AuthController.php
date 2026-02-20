<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

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

        $credentials = $request->only('email', 'password');

        if (!$token = Auth::attempt($credentials)) {
            return response()->json(['message' => 'Email atau password salah.'], 401);
        }

        return $this->respondWithToken($token);
    }

    /**
     * Dapatkan data user yang sedang login.
     */
    public function me()
    {
        return response()->json(Auth::user());
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
