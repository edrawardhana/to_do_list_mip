<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Support\Facades\Validator;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;

class AuthController extends Controller
{
    public function register(Request $request)
{
    $validator = Validator::make($request->all(), [
        'full_name' => 'required|string|max:255',
        'username' => 'required|string|max:255', // Dari UI Frontend
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

    return response()->json([
        'message' => 'User successfully registered. Please wait for admin approval.',
        'user' => $user
    ], 201);
}

    public function login(Request $request)
{
    // Map 'password' input to 'password_hash' for JWT attempt
    $credentials = [
        'email'         => $request->email,
        'password'      => $request->password, // JWT uses getAuthPassword() internally
    ];

    if (!$token = Auth::guard('api')->attempt($credentials)) {
        return response()->json(['error' => 'Unauthorized'], 401);
    }

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
