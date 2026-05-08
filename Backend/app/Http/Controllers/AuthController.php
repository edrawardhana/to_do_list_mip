<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;

class AuthController extends Controller
{
    /**
     * Register a new intern User
     */
    public function register(Request $request)
    {
        $request->validate([
            'full_name'   => 'required|string|max:255',
            'username'    => 'nullable|string|max:100|unique:profiles,username',
            'email'       => 'required|string|email|max:255|unique:profiles,email',
            'division_id' => 'required|uuid|exists:divisions,id',
            'password'    => 'required|string|min:6|confirmed',
        ]);

        $user = User::create([
            'full_name'     => $request->full_name,
            'username'      => $request->username,
            'email'         => $request->email,
            'division_id'   => $request->division_id,
            'password_hash' => Hash::make($request->password),
            'role'          => 'intern',
            'is_verified'   => false,
            'is_locked'     => false,
        ]);

        return response()->json([
            'status'  => 'success',
            'message' => 'Registrasi berhasil. Silakan tunggu persetujuan Admin divisi kamu.',
            'data'    => $user
        ], 201);
    }

    /**
     * Get a JWT via given credentials.
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();

        // ERD v3 uses password_hash instead of standard password column, so we check manually
        if (!$user || !Hash::check($request->password, $user->password_hash)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Email atau Password salah.'
            ], 401);
        }

        // Check if verified
        if ($user->role === 'intern' && !$user->is_verified) {
             return response()->json([
                'status' => 'error',
                'message' => 'Akun belum diverifikasi oleh Admin/HR.'
            ], 403);
        }

        // Issue token manually since Auth::attempt expects 'password' column
        $token = JWTAuth::fromUser($user);

        return $this->respondWithToken($token);
    }

    /**
     * Get the authenticated User.
     */
    public function me()
    {
        /** @var \App\Models\User|null $user */
        $user = Auth::user();
        if ($user) {
            $user->load('division');
        }

        return response()->json([
            'status' => 'success',
            'data' => $user
        ]);
    }

    /**
     * Log the user out (Invalidate the token).
     */
    public function logout()
    {
        Auth::logout();

        return response()->json([
            'status' => 'success',
            'message' => 'Berhasil logout.'
        ]);
    }

    /**
     * Refresh a token.
     */
    public function refresh()
    {
        return $this->respondWithToken(Auth::refresh());
    }

    /**
     * Get the token array structure.
     */
    protected function respondWithToken($token)
    {
        return response()->json([
            'status' => 'success',
            'authorization' => [
                'token' => $token,
                'type' => 'bearer',
                'expires_in' => Auth::factory()->getTTL() * 60
            ],
            'user' => Auth::user()
        ]);
    }
}
