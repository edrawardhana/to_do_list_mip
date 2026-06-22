<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Support\Facades\DB;
use App\Models\DailyTask;
use App\Models\AuditLog;
use App\Models\Notification;
use App\Models\TaskTemplate;
use App\Models\User;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withSchedule(function (\Illuminate\Console\Scheduling\Schedule $schedule) {

        // ══════════════════════════════════════════════════════════════════════
        // CRON 1: Otomasi Pembersihan Data 60 Hari (Setiap Malam 00:00 WIB)
        // ══════════════════════════════════════════════════════════════════════
        $schedule->call(function () {
            $cutoff = Carbon::now('Asia/Jakarta')->subDays(60)->startOfDay();
            $month  = Carbon::now('Asia/Jakarta')->format('F Y');

            Log::info("[Housekeeping] Memulai cleanup data sebelum {$cutoff->toDateString()} ...");

            // 1. Hapus file bukti foto dari storage
            $filesDeleted = 0;
            $filesFailed  = 0;
            DailyTask::where('created_at', '<', $cutoff)
                ->whereNotNull('evidence_url')
                ->select('id', 'evidence_url')
                ->each(function ($task) use (&$filesDeleted, &$filesFailed) {
                    try {
                        $appUrl = config('app.url');
                        $path   = str_replace([$appUrl . '/storage/', '/storage/'], '', $task->evidence_url);
                        if ($path && str_contains($path, '/') && !str_starts_with($path, 'http')) {
                            Storage::disk('public')->delete($path);
                        }
                        $filesDeleted++;
                    } catch (\Exception $e) {
                        Log::warning("[Housekeeping] Gagal hapus file task {$task->id}: " . $e->getMessage());
                        $filesFailed++;
                    }
                });

            // 2. Hapus daily_tasks lama
            $tasksDeleted = DailyTask::where('created_at', '<', $cutoff)->delete();

            // 3. Hapus notifikasi lama
            $notifsDeleted = Notification::where('created_at', '<', $cutoff)->delete();

            // 4. Hapus audit_logs lama
            $auditDeleted = 0;
            try {
                DB::statement("SET session_replication_role = replica");
                $auditDeleted = AuditLog::where('created_at', '<', $cutoff)->delete();
                DB::statement("SET session_replication_role = DEFAULT");
            } catch (\Exception $e) {
                DB::statement("SET session_replication_role = DEFAULT");
                Log::error("[Housekeeping] Gagal hapus audit_logs: " . $e->getMessage());
            }

            Log::info("[Housekeeping {$month}] Selesai: {$tasksDeleted} tasks, {$notifsDeleted} notifs, {$auditDeleted} audit logs, {$filesDeleted} files dihapus. ({$filesFailed} file gagal)");

        })->timezone('Asia/Jakarta')->dailyAt('00:00')->name('housekeeping-60days')->withoutOverlapping();

        // ══════════════════════════════════════════════════════════════════════
        // CRON 2: Pengingat Tugas Dinamis per Template (Setiap Menit)
        // Cocokkan template aktif yang reminder_time = jam WIB sekarang,
        // kirim notifikasi ke intern yang belum menyelesaikan tugas hari ini.
        // ══════════════════════════════════════════════════════════════════════
        $schedule->call(function () {
            $nowWIB    = Carbon::now('Asia/Jakarta');
            $currentHM = $nowWIB->format('H:i'); // "HH:MM"
            $today     = $nowWIB->toDateString();

            $templates = TaskTemplate::where('is_active', true)
                ->where('reminder_time', $currentHM)
                ->get();

            if ($templates->isEmpty()) return;

            foreach ($templates as $template) {
                $interns = User::where('division_id', $template->division_id)
                    ->where('role', 'intern')
                    ->where('is_verified', true)
                    ->where('is_locked', false)
                    ->get();

                foreach ($interns as $intern) {
                    // Check if the template matches the intern's shift today
                    $userShift = \App\Models\Schedule::where('user_id', $intern->id)
                        ->whereDate('shift_date', $today)
                        ->first();

                    if ($userShift) {
                        if (!TaskTemplate::matchesShift($template->start_time, $userShift->shift_type)) {
                            continue;
                        }
                    }

                    $task = DailyTask::where('uploader_id', $intern->id)
                        ->where('template_id', $template->id)
                        ->where('task_date', $today)
                        ->first();

                    $taskBelumSelesai = !$task || ($task->status === 'pending' && !$task->submitted_at);

                    if ($taskBelumSelesai) {
                        Notification::create([
                            'user_id'    => $intern->id,
                            'title'      => '⏰ Pengingat Tugas Harian',
                            'message'    => "Jangan lupa kumpulkan laporan \"{$template->title}\" sebelum jam {$template->end_time} WIB!",
                            'type'       => 'warning',
                            'is_read'    => false,
                            'created_at' => now(),
                        ]);
                    }
                }
            }
        })->everyMinute()->name('task-reminder-dynamic')->withoutOverlapping();

    })
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->prepend([
            \Illuminate\Http\Middleware\HandleCors::class,
        ]);
        $middleware->api(append: [
            \App\Http\Middleware\CheckAccountLock::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
