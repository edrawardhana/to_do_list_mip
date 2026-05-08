<?php

namespace App\Http\Controllers;

use App\Models\Broadcast;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use App\Models\AuditLog;

class BroadcastController extends Controller
{
    // ── Public read ───────────────────────────────────────────────────────────

    public function index(Request $request)
    {
        $query = Broadcast::orderBy('created_at', 'desc');

        if ($request->boolean('active_only')) {
            $query->where('expires_at', '>=', now());
        }

        return response()->json(['status' => 'success', 'data' => $query->get()]);
    }

    public function history()
    {
        $broadcasts = Broadcast::with('author')->orderBy('created_at', 'desc')->get();

        $formatted = $broadcasts->map(fn($b) => [
            'id'     => $b->id,
            'title'  => $b->title,
            'date'   => $b->created_at?->format('d M Y, H:i') ?? now()->format('d M Y, H:i'),
            'target' => $b->target_label ?? 'Global',
            'sender' => $b->author?->full_name ?? 'Admin',
        ]);

        return response()->json(['status' => 'success', 'data' => $formatted]);
    }

    // ── Send broadcast + FCM ──────────────────────────────────────────────────

    /**
     * Send broadcast with Firebase FCM push notification.
     *
     * targetType values:
     *   global           → all verified interns
     *   division         → interns in selected division IDs (targets = [uuid, ...])
     *   division_locked  → all interns in sender's own division
     *   personal         → specific user IDs (targets = [uuid, ...])
     *   personal_locked  → specific users from sender's division
     */
    public function send(Request $request)
    {
        $user = Auth::user();

        $request->validate([
            'title'      => 'required|string|max:255',
            'content'    => 'required|string',
            'targetType' => 'required|string|in:global,division,division_locked,personal,personal_locked',
            'targets'    => 'nullable|array',
            'targets.*'  => 'uuid',
            'category'   => 'nullable|in:info,urgent',
        ]);

        $category = $request->category ?? 'info';

        // ── 1. Resolve target users ───────────────────────────────────────────
        $targetUsers = $this->resolveTargetUsers(
            $request->targetType,
            $request->targets ?? [],
            $user
        );

        $targetLabel = $this->buildTargetLabel($request->targetType, $request->targets ?? [], $user);

        // ── 2. Save broadcast ─────────────────────────────────────────────────
        $broadcast = Broadcast::create([
            'author_id'    => $user->id,
            'title'        => $request->title,
            'content'      => $request->content,
            'category'     => $category,
            'expires_at'   => now()->addDays(7),
            'created_at'   => now(),
        ]);

        // ── 3. Create in-app Notification records for each target ─────────────
        foreach ($targetUsers as $target) {
            Notification::create([
                'user_id'    => $target->id,
                'title'      => $request->title,
                'message'    => $request->content,
                'type'       => $category === 'urgent' ? 'warning' : 'info',
                'is_read'    => false,
                'created_at' => now(),
            ]);
        }

        // ── 4. Send FCM push notifications ────────────────────────────────────
        $fcmResult = $this->dispatchFcm(
            $targetUsers,
            $request->title,
            $request->content,
            $category
        );

        AuditLog::record($user->id, $user->role, 'Send Broadcast', [
            'broadcast_id'   => $broadcast->id,
            'target_type'    => $request->targetType,
            'target_count'   => $targetUsers->count(),
            'fcm_sent'       => $fcmResult['sent'],
            'fcm_failed'     => $fcmResult['failed'],
            'fcm_no_token'   => $fcmResult['no_token'],
        ]);

        $msg = "Broadcast disimpan. {$targetUsers->count()} notifikasi in-app dibuat.";
        if ($fcmResult['sent'] > 0) {
            $msg .= " FCM terkirim ke {$fcmResult['sent']} perangkat.";
        } elseif ($fcmResult['skipped']) {
            $msg .= " FCM dilewati (konfigurasi belum lengkap).";
        }

        return response()->json([
            'status'  => 'success',
            'message' => $msg,
            'data'    => $broadcast,
            'fcm'     => $fcmResult,
        ], 201);
    }

    // ── CRUD (superadmin only) ────────────────────────────────────────────────

    public function store(Request $request)
    {
        $user = Auth::user();
        if ($user->role !== 'super_admin') {
            return response()->json(['status' => 'error', 'message' => 'Hanya Super Admin yang bisa membuat Broadcast.'], 403);
        }

        $request->validate([
            'title'      => 'required|string',
            'content'    => 'required|string',
            'category'   => 'required|in:info,urgent',
            'expires_at' => 'required|date|after:now',
        ]);

        $broadcast = Broadcast::create([
            'author_id'  => $user->id,
            'title'      => $request->title,
            'content'    => $request->content,
            'category'   => $request->category,
            'expires_at' => $request->expires_at,
            'created_at' => now(),
        ]);

        AuditLog::record($user->id, $user->role, 'Buat Broadcast', $broadcast->toArray());

        return response()->json(['status' => 'success', 'message' => 'Broadcast berhasil dibuat.', 'data' => $broadcast], 201);
    }

    public function update(Request $request, $id)
    {
        $user = Auth::user();
        if ($user->role !== 'super_admin') {
            return response()->json(['status' => 'error', 'message' => 'Hanya Super Admin yang bisa mengubah Broadcast.'], 403);
        }

        $broadcast  = Broadcast::findOrFail($id);
        $old_values = $broadcast->toArray();

        $request->validate([
            'title'      => 'sometimes|string',
            'content'    => 'sometimes|string',
            'category'   => 'sometimes|in:info,urgent',
            'expires_at' => 'sometimes|date|after:now',
        ]);

        $broadcast->update($request->only(['title', 'content', 'category', 'expires_at']));
        AuditLog::record($user->id, $user->role, 'Update Broadcast', $broadcast->fresh()->toArray(), $old_values);

        return response()->json(['status' => 'success', 'message' => 'Broadcast berhasil diperbarui.', 'data' => $broadcast]);
    }

    public function destroy($id)
    {
        $user = Auth::user();
        if ($user->role !== 'super_admin') {
            return response()->json(['status' => 'error', 'message' => 'Hanya Super Admin yang bisa menghapus Broadcast.'], 403);
        }

        $broadcast  = Broadcast::findOrFail($id);
        $old_values = $broadcast->toArray();
        $broadcast->delete();

        AuditLog::record($user->id, $user->role, 'Hapus Broadcast', null, $old_values);

        return response()->json(['status' => 'success', 'message' => 'Broadcast berhasil dihapus.']);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    /**
     * Resolve the collection of target User models based on targetType.
     */
    private function resolveTargetUsers(string $targetType, array $targets, User $sender)
    {
        $base = User::where('is_verified', true)
                    ->whereNull('deleted_at')
                    ->whereIn('role', ['intern', 'admin']);

        return match ($targetType) {
            'global' => (clone $base)->get(),

            'division' => (clone $base)
                ->whereIn('division_id', $targets)
                ->get(),

            'division_locked' => (clone $base)
                ->where('division_id', $sender->division_id)
                ->get(),

            'personal' => (clone $base)
                ->whereIn('id', $targets)
                ->get(),

            'personal_locked' => (clone $base)
                ->whereIn('id', $targets)
                ->where('division_id', $sender->division_id)
                ->get(),

            default => collect(),
        };
    }

    private function buildTargetLabel(string $targetType, array $targets, User $sender): string
    {
        return match ($targetType) {
            'global'          => 'Global (Semua Intern)',
            'division_locked' => 'Divisi ' . ($sender->division?->name ?? 'Saya'),
            'division'        => 'Divisi Tertentu (' . count($targets) . ')',
            'personal',
            'personal_locked' => 'Personal (' . count($targets) . ' orang)',
            default           => 'Unknown',
        };
    }

    /**
     * Send FCM push notifications to all target users that have an fcm_token.
     * Uses Firebase HTTP v1 API with service account JWT auth.
     *
     * Returns summary: ['sent' => int, 'failed' => int, 'no_token' => int, 'skipped' => bool]
     */
    private function dispatchFcm($targetUsers, string $title, string $body, string $category): array
    {
        $result = ['sent' => 0, 'failed' => 0, 'no_token' => 0, 'skipped' => false];

        // Load Firebase config from system_configs
        $configs = \App\Models\SystemConfig::whereIn('key', [
            'FIREBASE_PROJECT_ID',
            'FIREBASE_SERVICE_ACCOUNT_JSON',
        ])->pluck('value', 'key');

        $projectId          = $configs['FIREBASE_PROJECT_ID'] ?? null;
        $serviceAccountJson = $configs['FIREBASE_SERVICE_ACCOUNT_JSON'] ?? null;

        if (!$projectId || !$serviceAccountJson || $serviceAccountJson === '-') {
            $result['skipped'] = true;
            return $result;
        }

        try {
            $serviceAccount = json_decode($serviceAccountJson, true);
            if (!$serviceAccount || !isset($serviceAccount['client_email'])) {
                $result['skipped'] = true;
                return $result;
            }

            $accessToken = $this->getFcmAccessToken($serviceAccount);
            $url         = "https://fcm.googleapis.com/v1/projects/{$projectId}/messages:send";
            $appUrl      = config('app.url');
            $clickAction = $appUrl . '/dashboard';

            foreach ($targetUsers as $user) {
                if (empty($user->fcm_token)) {
                    $result['no_token']++;
                    continue;
                }

                $payload = [
                    'message' => [
                        'token' => $user->fcm_token,
                        // notification block → triggers OS notification (background + foreground)
                        'notification' => [
                            'title' => $title,
                            'body'  => $body,
                        ],
                        // webpush overrides for browser
                        'webpush' => [
                            'headers' => [
                                'Urgency' => $category === 'urgent' ? 'high' : 'normal',
                            ],
                            'notification' => [
                                'title'              => $title,
                                'body'               => $body,
                                'icon'               => '/logo192.png',
                                'badge'              => '/logo192.png',
                                'tag'                => 'broadcast',
                                'renotify'           => true,
                                'requireInteraction' => $category === 'urgent',
                                'vibrate'            => $category === 'urgent' ? [200, 100, 200] : [100],
                            ],
                            'fcm_options' => [
                                'link' => $clickAction,
                            ],
                        ],
                        // data payload — readable by foreground onMessage handler
                        'data' => [
                            'category' => $category,
                            'url'      => $clickAction,
                            'title'    => $title,
                            'body'     => $body,
                        ],
                    ],
                ];

                $response = Http::withToken($accessToken)
                    ->timeout(10)
                    ->post($url, $payload);

                if ($response->successful()) {
                    $result['sent']++;
                } else {
                    $result['failed']++;
                    $responseBody = $response->json();
                    $errorCode    = $responseBody['error']['details'][0]['errorCode']
                                 ?? $responseBody['error']['status']
                                 ?? '';

                    \Illuminate\Support\Facades\Log::warning('FCM send failed', [
                        'user_id'    => $user->id,
                        'error_code' => $errorCode,
                        'response'   => $responseBody,
                    ]);

                    // Clear invalid/expired tokens
                    if (in_array($errorCode, ['UNREGISTERED', 'INVALID_ARGUMENT', 'INVALID_REGISTRATION'])) {
                        $user->update(['fcm_token' => null]);
                    }
                }
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('FCM dispatch error: ' . $e->getMessage());
            $result['failed'] += $targetUsers->count() - $result['sent'] - $result['no_token'];
        }

        return $result;
    }

    /**
     * Exchange service account credentials for a short-lived Google OAuth2 access token.
     */
    private function getFcmAccessToken(array $serviceAccount): string
    {
        $now     = time();
        $payload = [
            'iss'   => $serviceAccount['client_email'],
            'scope' => 'https://www.googleapis.com/auth/firebase.messaging',
            'aud'   => 'https://oauth2.googleapis.com/token',
            'exp'   => $now + 3600,
            'iat'   => $now,
        ];

        $jwt = \Firebase\JWT\JWT::encode($payload, $serviceAccount['private_key'], 'RS256');

        $response = Http::asForm()->post('https://oauth2.googleapis.com/token', [
            'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            'assertion'  => $jwt,
        ]);

        if ($response->failed()) {
            throw new \Exception('Failed to get FCM OAuth token: ' . $response->body());
        }

        return $response->json()['access_token'];
    }
}
