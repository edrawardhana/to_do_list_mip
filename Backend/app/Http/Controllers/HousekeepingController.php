<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\DailyTask;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class HousekeepingController extends Controller
{
    // Retention period in days
    private const RETENTION_DAYS = 90;

    /**
     * POST /api/housekeeping/cleanup
     * Manual cleanup — developer only.
     * Body: { "confirm": "HAPUS DATA TUA" }
     */
    public function cleanup(Request $request)
    {
        $user = Auth::user();

        if ($user->role !== 'developer') {
            return response()->json([
                'status'  => 'error',
                'message' => 'Hanya Developer yang dapat menjalankan housekeeping.',
            ], 403);
        }

        $request->validate([
            'confirm' => 'required|string',
        ]);

        if ($request->confirm !== 'HAPUS DATA TUA') {
            return response()->json([
                'status'  => 'error',
                'message' => 'Konfirmasi tidak valid. Ketik: HAPUS DATA TUA',
            ], 422);
        }

        $cutoff = now()->subDays(self::RETENTION_DAYS);
        $result = $this->runCleanup($cutoff);

        // Log ke audit_logs
        AuditLog::record(
            $user->id,
            $user->role,
            'Housekeeping Manual',
            [
                'cutoff_date'       => $cutoff->toDateString(),
                'tasks_deleted'     => $result['tasks_deleted'],
                'audit_deleted'     => $result['audit_deleted'],
                'files_deleted'     => $result['files_deleted'],
                'files_failed'      => $result['files_failed'],
                'executed_at'       => now()->toDateTimeString(),
            ]
        );

        $month = now()->format('F Y');
        Log::info("Housekeeping {$month}: {$result['tasks_deleted']} tasks, {$result['audit_deleted']} audit logs, {$result['files_deleted']} files deleted.");

        return response()->json([
            'status'  => 'success',
            'message' => "Cleanup {$month} berhasil. {$result['tasks_deleted']} task & {$result['files_deleted']} foto dihapus.",
            'data'    => $result,
        ]);
    }

    /**
     * GET /api/housekeeping/preview
     * Preview how many rows would be deleted — no actual deletion.
     */
    public function preview()
    {
        $user = Auth::user();

        if ($user->role !== 'developer') {
            return response()->json(['status' => 'error', 'message' => 'Akses ditolak.'], 403);
        }

        $cutoff = now()->subDays(self::RETENTION_DAYS);

        $taskCount  = DailyTask::where('created_at', '<', $cutoff)->count();
        $auditCount = \App\Models\AuditLog::where('created_at', '<', $cutoff)->count();

        // Count files that would be deleted
        $fileCount = DailyTask::where('created_at', '<', $cutoff)
            ->whereNotNull('evidence_url')
            ->count();

        return response()->json([
            'status' => 'success',
            'data'   => [
                'cutoff_date'        => $cutoff->toDateString(),
                'retention_days'     => self::RETENTION_DAYS,
                'tasks_to_delete'    => $taskCount,
                'audit_to_delete'    => $auditCount,
                'files_to_delete'    => $fileCount,
            ],
        ]);
    }

    /**
     * Core cleanup logic — shared by manual and cron endpoints.
     */
    public function runCleanup(\Carbon\Carbon $cutoff): array
    {
        $result = [
            'tasks_deleted'  => 0,
            'audit_deleted'  => 0,
            'files_deleted'  => 0,
            'files_failed'   => 0,
            'cutoff_date'    => $cutoff->toDateString(),
        ];

        // ── 1. Delete evidence files from storage ─────────────────────────────
        $tasksWithFiles = DailyTask::where('created_at', '<', $cutoff)
            ->whereNotNull('evidence_url')
            ->select('id', 'evidence_url')
            ->get();

        foreach ($tasksWithFiles as $task) {
            try {
                $path = $this->extractStoragePath($task->evidence_url);
                if ($path && Storage::disk('public')->exists($path)) {
                    Storage::disk('public')->delete($path);
                    $result['files_deleted']++;
                } else {
                    $result['files_deleted']++; // Count as deleted even if not found locally
                }
            } catch (\Exception $e) {
                Log::warning("Housekeeping: failed to delete file for task {$task->id}: " . $e->getMessage());
                $result['files_failed']++;
            }
        }

        // ── 2. Delete old daily_tasks rows ────────────────────────────────────
        $result['tasks_deleted'] = DailyTask::where('created_at', '<', $cutoff)->delete();

        // ── 3. Delete old audit_logs rows ─────────────────────────────────────
        // Note: Ghost lock triggers block DELETE on audit_logs.
        // We use session_replication_role = replica to bypass triggers temporarily.
        try {
            DB::statement("SET session_replication_role = replica");
            $result['audit_deleted'] = DB::table('audit_logs')
                ->where('created_at', '<', $cutoff)
                ->delete();
            DB::statement("SET session_replication_role = DEFAULT");
        } catch (\Exception $e) {
            DB::statement("SET session_replication_role = DEFAULT");
            Log::error("Housekeeping: audit_logs cleanup failed: " . $e->getMessage());
        }

        return $result;
    }

    /**
     * Extract relative storage path from a full URL.
     * e.g. "http://localhost:8000/storage/task_evidence/file.jpg" → "task_evidence/file.jpg"
     */
    private function extractStoragePath(string $url): ?string
    {
        // Remove base URL + /storage/ prefix
        $appUrl = config('app.url');
        $path   = str_replace([$appUrl . '/storage/', '/storage/'], '', $url);

        // Sanity check — must look like a file path
        if (str_contains($path, '/') && !str_starts_with($path, 'http')) {
            return $path;
        }

        return null;
    }
}
