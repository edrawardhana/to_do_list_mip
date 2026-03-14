<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Support\Facades\Validator;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use App\Models\AuditLog;

class AuthController extends Controller
{
    public function register(Request $request)
{
    $validator = Validator::make($request->all(), [
        'full_name' => 'required|string|max:255',
        'username' => 'required|string|max:255|unique:profiles', // Harus unik di database
        'email' => 'required|email|unique:profiles',
        'password' => 'required|min:8|confirmed', // Min 8 dan butuh password_confirmation
        'division_id' => 'required|uuid|exists:divisions,id', // Dropdown divisi
    ]);

    if ($validator->fails()) {
        return response()->json($validator->errors(), 422);
    }

    $user = User::create([
        'full_name' => $request->full_name,
        'username' => $request->username,
        'email' => $request->email,
        'password_hash' => bcrypt($request->password),
        'division_id' => $request->division_id,
        'role' => 'user',
        'shift' => null,
        'is_locked' => true // Terkunci otomatis, menunggu ACC admin
    ]);

    AuditLog::record($user->id, 'Register', "User baru mendaftar dan menunggu verifikasi Admin");

    return response()->json([
        'message' => 'User successfully registered. Please wait for admin approval.',
        'user' => $user
    ], 201);
}

    public function login(Request $request)
    {
        // Validasi input dari Frontend
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $credentials = [
            'email'    => $request->email,
            'password' => $request->password,
        ];

        if (!$token = Auth::guard('api')->attempt($credentials)) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        // Cek apakah akun masih dikunci oleh Admin
        $user = Auth::guard('api')->user();
        if ($user->is_locked) {
            Auth::guard('api')->logout(); // Hancurkan token yang baru dibuat
            return response()->json(['error' => 'Akun Anda masih dikunci. Hubungi Admin untuk persetujuan.'], 403);
        }

        AuditLog::record($user->id, 'Login Sukses', "User berhasil masuk ke dalam sistem");

        return $this->respondWithToken($token);
    }

    public function me()
    {
        return response()->json(Auth::guard('api')->user());
    }

    public function logout()
    {
        Auth::guard('api')->logout();

        return response()->json(['message' => 'Successfully logged out']);
    }

    protected function respondWithToken($token)
    {
        return response()->json([
            'access_token' => $token,
            'token_type' => 'bearer',
            'expires_in' => JWTAuth::factory()->getTTL() * 60
        ]);
    }
}
