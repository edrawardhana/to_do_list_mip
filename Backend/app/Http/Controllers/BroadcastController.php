<?php

namespace App\Http\Controllers;

use App\Models\Broadcast;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\AuditLog;

class BroadcastController extends Controller
{
    /**
     * Get list of broadcasts
     */
    public function index(Request $request)
    {
        // All users can see active broadcasts
        // Can filter by non-expired if needed, but returning all for now ordered by newest
        $query = Broadcast::orderBy('created_at', 'desc');

        if ($request->has('active_only') && $request->active_only == 'true') {
            $query->where('expires_at', '>=', now());
        }

        $broadcasts = $query->get();

        return response()->json([
            'status' => 'success',
            'data' => $broadcasts
        ]);
    }

    /**
     * Get broadcast history formatted mapping for frontend UI.
     */
    public function history()
    {
        $broadcasts = Broadcast::with('author')->orderBy('created_at', 'desc')->get();
        
        $formatted = $broadcasts->map(function($b) {
            return [
                'id' => $b->id,
                'title' => $b->title,
                'date' => $b->created_at ? $b->created_at->format('d M Y, H:i') : now()->format('d M Y, H:i'),
                'target' => 'Global (Semua Intern)', // default mapping
                'sender' => $b->author ? ($b->author->full_name ?? 'Admin') : 'Superadmin',
            ];
        });

        return response()->json([
            'status' => 'success',
            'data' => $formatted
        ]);
    }

    /**
     * Send Broadcast Notifications using Firebase Cloud Messaging API v1
     */
    public function send(Request $request)
    {
        $user = Auth::user();

        $request->validate([
            'title' => 'required|string',
            'content' => 'required|string',
            'targetType' => 'required|string'
        ]);

        // 1. Save broadcast to database
        $broadcast = Broadcast::create([
            'author_id' => $user->id,
            'title' => $request->title,
            'content' => $request->content,
            'category' => 'info',
            'expires_at' => now()->addDays(7),
            'created_at' => now()
        ]);

        // 2. Get Firebase Configuration from SystemConfig
        $configs = \App\Models\SystemConfig::whereIn('key', [
            'FIREBASE_PROJECT_ID',
            'FIREBASE_SERVICE_ACCOUNT_JSON'
        ])->pluck('value', 'key');

        $projectId = $configs['FIREBASE_PROJECT_ID'] ?? null;
        $serviceAccountJson = $configs['FIREBASE_SERVICE_ACCOUNT_JSON'] ?? null;

        if (!$projectId || !$serviceAccountJson || $serviceAccountJson === '-') {
            return response()->json([
                'status' => 'success',
                'message' => 'Broadcast disimpan di DB, tapi FCM tidak terkirim karena konfigurasi belum lengkap.',
                'data' => $broadcast
            ]);
        }

        try {
            $serviceAccount = json_decode($serviceAccountJson, true);
            $accessToken = $this->getFcmAccessToken($serviceAccount);

            // Get tokens to send to
            $tokens = [];
            if ($request->targetType === 'global') {
                $tokens = \App\Models\User::whereNotNull('fcm_token')->pluck('fcm_token')->toArray();
            } else {
                // Implement targeted tokens based on $request->targets if needed
                // For now, let's just handle global for simplicity or specific list
                if ($request->has('targets') && is_array($request->targets)) {
                    $tokens = \App\Models\User::whereIn('id', $request->targets)
                                            ->orWhereIn('division_id', $request->targets)
                                            ->whereNotNull('fcm_token')
                                            ->pluck('fcm_token')
                                            ->toArray();
                }
            }

            if (empty($tokens)) {
                return response()->json([
                    'status' => 'success',
                    'message' => 'Broadcast berhasil disimpan, namun tidak ada device token aktif ditemukan.',
                    'data' => $broadcast
                ]);
            }

            // Send notifications (Batching might be needed if many tokens)
            $results = [];
            foreach ($tokens as $token) {
                $results[] = $this->sendFcmMessage($projectId, $accessToken, $token, $request->title, $request->content);
            }

            AuditLog::record($user->id, $user->role, 'Send Broadcast FCM', [
                'broadcast_id' => $broadcast->id,
                'total_targets' => count($tokens),
                'results' => $results
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Broadcast berhasil dikirim ke ' . count($tokens) . ' perangkat.',
                'data' => $broadcast
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal mengirim FCM: ' . $e->getMessage(),
                'data' => $broadcast
            ], 500);
        }
    }

    /**
     * Helper to get Google OAuth2 Access Token
     */
    private function getFcmAccessToken($serviceAccount)
    {
        $now = time();
        $payload = [
            'iss' => $serviceAccount['client_email'],
            'scope' => 'https://www.googleapis.com/auth/firebase.messaging',
            'aud' => 'https://oauth2.googleapis.com/token',
            'exp' => $now + 3600,
            'iat' => $now
        ];

        $jwt = \Firebase\JWT\JWT::encode($payload, $serviceAccount['private_key'], 'RS256');

        $response = \Illuminate\Support\Facades\Http::asForm()->post('https://oauth2.googleapis.com/token', [
            'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            'assertion' => $jwt
        ]);

        if ($response->failed()) {
            throw new \Exception('Failed to get OAuth token: ' . $response->body());
        }

        return $response->json()['access_token'];
    }

    /**
     * Helper to send individual FCM message via HTTP v1
     */
    private function sendFcmMessage($projectId, $accessToken, $token, $title, $body)
    {
        $url = "https://fcm.googleapis.com/v1/projects/{$projectId}/messages:send";

        $message = [
            'message' => [
                'token' => $token,
                'notification' => [
                    'title' => $title,
                    'body' => $body
                ],
                'webpush' => [
                    'notification' => [
                        'icon' => '/logo192.png', // Update with actual icon path
                        'click_action' => 'https://your-domain.com/dashboard'
                    ]
                ]
            ]
        ];

        $response = \Illuminate\Support\Facades\Http::withToken($accessToken)
            ->post($url, $message);

        return $response->json();
    }

    /**
     * Create a Broadcast
     */
    public function store(Request $request)
    {
        $user = Auth::user();

        if ($user->role !== 'super_admin') {
            return response()->json(['status' => 'error', 'message' => 'Hanya Super Admin yang bisa membuat Broadcast sistem.'], 403);
        }

        $request->validate([
            'title' => 'required|string',
            'content' => 'required|string',
            'category' => 'required|in:info,urgent',
            'expires_at' => 'required|date|after:now'
        ]);

        $broadcast = Broadcast::create([
            'author_id' => $user->id,
            'title' => $request->title,
            'content' => $request->content,
            'category' => $request->category,
            'expires_at' => $request->expires_at,
            'created_at' => now()
        ]);

        AuditLog::record($user->id, $user->role, 'Buat Broadcast', $broadcast->toArray());

        return response()->json([
            'status' => 'success',
            'message' => 'Broadcast berhasil dibuat.',
            'data' => $broadcast
        ], 201);
    }

    /**
     * Update Broadcast
     */
    public function update(Request $request, $id)
    {
        $user = Auth::user();

        if ($user->role !== 'super_admin') {
            return response()->json(['status' => 'error', 'message' => 'Hanya Super Admin yang bisa mengubah Broadcast.'], 403);
        }

        $broadcast = Broadcast::findOrFail($id);
        $old_values = $broadcast->toArray();

        $request->validate([
            'title' => 'sometimes|string',
            'content' => 'sometimes|string',
            'category' => 'sometimes|in:info,urgent',
            'expires_at' => 'sometimes|date|after:now'
        ]);

        $broadcast->update($request->only(['title', 'content', 'category', 'expires_at']));

        AuditLog::record($user->id, $user->role, 'Update Broadcast', $broadcast->fresh()->toArray(), $old_values);

        return response()->json([
            'status' => 'success',
            'message' => 'Broadcast berhasil diperbarui.',
            'data' => $broadcast
        ]);
    }

    /**
     * Delete Broadcast
     */
    public function destroy($id)
    {
        $user = Auth::user();

        if ($user->role !== 'super_admin') {
            return response()->json(['status' => 'error', 'message' => 'Hanya Super Admin yang bisa menghapus Broadcast.'], 403);
        }

        $broadcast = Broadcast::findOrFail($id);
        $old_values = $broadcast->toArray();
        $broadcast->delete();

        AuditLog::record($user->id, $user->role, 'Hapus Broadcast', null, $old_values);

        return response()->json([
            'status' => 'success',
            'message' => 'Broadcast berhasil dihapus.'
        ]);
    }
}
