<?php

namespace App\Http\Controllers;

use App\Models\DailyTask;
use App\Models\TaskTemplate;
use App\Models\User;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Database\QueryException;
use App\Models\AuditLog;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;
use Intervention\Image\Encoders\JpegEncoder;
use Illuminate\Support\Str;
use Carbon\Carbon;

class DailyTaskController extends Controller
{
    /**
     * Get Logbook data with Data Isolation.
     * Includes lazy-timeout cleanup for expired mention confirmations.
     */
    public function index(Request $request)
    {
        $user = Auth::user();

        // ── LAZY TIMEOUT CLEANUP ────────────────────────────────────────────
        // Reset tugas yang `waiting_confirmation` > 10 menit agar intern bisa
        // mengerjakan ulang tanpa harus refresh manual atau menunggu cron.
        $cutoffMention = Carbon::now()->subMinutes(10);
        $expiredTasks  = DailyTask::where('status', 'waiting_confirmation')
            ->where('mention_submitted_at', '<', $cutoffMention)
            ->get();

        foreach ($expiredTasks as $expired) {
            // Reset tugas ini (parent atau child) ke kondisi awal
            $this->resetMentionTask($expired);
        }

        // AUTO GENERATE TASKS FOR INTERN
        if ($user->role === 'intern' && $user->division_id) {
            $today     = now()->toDateString();
            
            // Get user's shift schedule for today
            $schedule  = \App\Models\Schedule::where('user_id', $user->id)
                ->whereDate('shift_date', $today)
                ->first();

            // ── SHIFT CHANGE CLEANUP ──────────────────────────────────────────
            // Jika shift hari ini berubah, hapus tugas template berstatus pending
            // (belum dikerjakan) yang tidak cocok dengan shift baru, agar list ter-update instan.
            if ($schedule) {
                $existingTemplateTasks = DailyTask::where('uploader_id', $user->id)
                    ->whereDate('task_date', $today)
                    ->whereNotNull('template_id')
                    ->where('status', 'pending')
                    ->whereNull('submitted_at')
                    ->get();

                foreach ($existingTemplateTasks as $existingTask) {
                    if ($existingTask->taskTemplate && !TaskTemplate::matchesShift($existingTask->taskTemplate->start_time, $schedule->shift_type)) {
                        $existingTask->delete();
                    }
                }
            }

            // ── AUTO GENERATE TASKS FOR INTERN (OPTIMIZED BULK INSERT) ──
            $templates = TaskTemplate::where('division_id', $user->division_id)
                ->where('is_active', true)
                ->get();

            // 1. Ambil semua ID template yang sudah dikerjakan hari ini (1x Query aja)
            $existingTaskTemplateIds = DailyTask::where('uploader_id', $user->id)
                ->whereDate('task_date', $today)
                ->whereNotNull('template_id')
                ->pluck('template_id')
                ->toArray();

            $tasksToInsert = [];

            foreach ($templates as $template) {
                // Filter by shift type
                if ($schedule && !TaskTemplate::matchesShift($template->start_time, $schedule->shift_type)) {
                    continue;
                }

                // 2. Cek di array memori, bukan nembak DB berulang-ulang
                if (!in_array($template->id, $existingTaskTemplateIds)) {
                    $tasksToInsert[] = [
                        'id'            => (string) \Illuminate\Support\Str::uuid(), // Wajib karena lu pakai HasUuids
                        'template_id'   => $template->id,
                        'uploader_id'   => $user->id,
                        'task_date'     => $today,
                        'division_id'   => $user->division_id,
                        'status'        => 'pending',
                        'assign_note'   => $template->description,
                        'start_time'    => $template->start_time,
                        'end_time'      => $template->end_time,
                        'reminder_time' => $template->reminder_time,
                        'created_at'    => now(),
                        'updated_at'    => now(),
                    ];
                }
            }

            // 3. Tembak database cuma 1x untuk semua tugas baru!
            if (!empty($tasksToInsert)) {
                DailyTask::insert($tasksToInsert);
            }
        }

        $query = DailyTask::with(['taskTemplate', 'uploader', 'evaluator', 'assignedBy', 'parentTask']);

        if ($user->role === 'intern') {
            $query->where('uploader_id', $user->id);
        } elseif ($user->role === 'admin') {
            $query->where('division_id', $user->division_id)
                ->where(function ($q) use ($user) {
                    $q->whereNull('parent_task_id')
                      ->orWhereHas('parentTask', function ($qp) use ($user) {
                          $qp->where('division_id', '!=', $user->division_id);
                      });
                });
        }
        // Superadmin sees all (no filter)

        if ($request->has('date')) {
            $query->whereDate('task_date', $request->date);
        }
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        if ($request->has('uploader_id')) {
            $query->where('uploader_id', $request->uploader_id);
        }

        $tasks = $query->orderBy('submitted_at', 'asc')  // Tertua submit duluan (fairness)
                       ->orderBy('created_at', 'desc')
                       ->get();

        // Resolve confirmed_participants IDs → full profile objects for display
        $allParticipantIds = $tasks
            ->pluck('confirmed_participants')
            ->flatten()
            ->filter()
            ->unique()
            ->values();

        $participantProfiles = [];
        if ($allParticipantIds->isNotEmpty()) {
            $participantProfiles = User::whereIn('id', $allParticipantIds)
                ->get(['id', 'full_name', 'avatar_url'])
                ->keyBy('id');
        }

        $tasks = $tasks->map(function ($task) use ($participantProfiles) {
            $participants = collect($task->confirmed_participants ?? [])
                ->map(fn($id) => isset($participantProfiles[$id])
                    ? ['id' => $id, 'full_name' => $participantProfiles[$id]->full_name, 'avatar_url' => $participantProfiles[$id]->avatar_url]
                    : ['id' => $id, 'full_name' => 'Intern', 'avatar_url' => null]
                )->values();

            $task->participants_detail = $participants;
            return $task;
        });

        return response()->json([
            'status' => 'success',
            'data'   => $tasks
        ]);
    }

    /**
     * Admin assigns task to specific intern(s)
     */
    public function assignTask(Request $request)
    {
        $user = Auth::user();

        if (!in_array($user->role, ['admin', 'super_admin'])) {
            return response()->json(['status' => 'error', 'message' => 'Hanya Admin yang dapat membagikan tugas.'], 403);
        }

        $request->validate([
            'template_id' => 'required|uuid|exists:task_templates,id',
            'intern_ids'  => 'required|array|min:1',
            'intern_ids.*'=> 'uuid|exists:profiles,id',
            'task_date'   => 'required|date',
            'assign_note' => 'nullable|string|max:500',
        ]);

        $template     = TaskTemplate::findOrFail($request->template_id);
        $createdTasks = [];
        $errors       = [];

        if ($user->role === 'admin' && $template->division_id !== $user->division_id) {
            return response()->json(['status' => 'error', 'message' => 'Anda hanya dapat membagikan tugas dalam divisi Anda.'], 403);
        }

        foreach ($request->intern_ids as $internId) {
            $intern = User::find($internId);

            if ($user->role === 'admin' && $intern->division_id !== $user->division_id) {
                $errors[] = "Intern {$intern->full_name} tidak dalam divisi Anda.";
                continue;
            }

            $existingTask = DailyTask::where('uploader_id', $internId)
                ->where('template_id', $request->template_id)
                ->where('task_date', $request->task_date)
                ->first();

            if ($existingTask) {
                $errors[] = "Tugas sudah ada untuk {$intern->full_name} pada tanggal ini.";
                continue;
            }

            $task = DailyTask::create([
                'uploader_id'   => $internId,
                'division_id'   => $template->division_id,
                'template_id'   => $request->template_id,
                'task_date'     => $request->task_date,
                'status'        => 'pending',
                'assign_note'   => $request->assign_note ?? $template->description,
                'assigned_by'   => $user->id,
                'start_time'    => $template->start_time,
                'end_time'      => $template->end_time,
                'reminder_time' => $template->reminder_time,
            ]);

            $createdTasks[] = $task;

            AuditLog::record($user->id, $user->role, 'Assign Task ke Intern', $task->toArray(), null, $internId);
        }

        return response()->json([
            'status'  => 'success',
            'message' => count($createdTasks) . ' tugas berhasil dibagikan.',
            'data'    => ['created_tasks' => $createdTasks, 'errors' => $errors]
        ], 201);
    }

    /**
     * Create new Task/Logbook
     */
    public function store(Request $request)
    {
        $user = Auth::user();

        // Jika user adalah intern, hanya bisa membuat tugasnya sendiri (atau menggunakan template)
        if ($user->role === 'intern') {
            $request->validate([
                'template_id'           => 'required|uuid',
                'task_date'             => 'required|date',
                'description'           => 'nullable|string',
                'evidence_url'          => 'nullable|string',
                'confirmed_participants' => 'nullable|array',
                'captured_at'           => 'nullable|date'
            ]);

            $template = TaskTemplate::find($request->template_id);

            $task = DailyTask::create([
                'uploader_id'           => $user->id,
                'division_id'           => $user->division_id,
                'template_id'           => $request->template_id,
                'task_date'             => $request->task_date,
                'description'           => $request->description,
                'status'                => 'pending',
                'evidence_url'          => $request->evidence_url,
                'confirmed_participants' => $request->confirmed_participants ?? [],
                'captured_at'           => $request->captured_at,
                'start_time'            => $template?->start_time,
                'end_time'              => $template?->end_time,
                'reminder_time'         => $template?->reminder_time,
            ]);

            AuditLog::record($user->id, $user->role, 'Buat Logbook', $task->toArray());

            return response()->json([
                'status'  => 'success',
                'message' => 'Berhasil membuat logbook tugas.',
                'data'    => $task
            ], 201);
        }

        // Jika user adalah admin atau super_admin, buat "Tugas Dadakan / Live Task"
        if (in_array($user->role, ['admin', 'super_admin'])) {
            $request->validate([
                'uploader_ids'   => 'required|array|min:1', // 🔥 Support banyak intern
                'uploader_ids.*' => 'uuid|exists:profiles,id',
                'description'    => 'required|string',
                'due_date'       => 'required|date',
                'assign_note'    => 'nullable|string|max:500',
                'division_id'    => 'required|uuid|exists:divisions,id',
                'start_time'     => ['nullable', 'string', 'regex:/^([01]\d|2[0-3]):[0-5]\d$/'],
                'end_time'       => ['nullable', 'string', 'regex:/^([01]\d|2[0-3]):[0-5]\d$/'],
                'reminder_time'  => ['nullable', 'string', 'regex:/^([01]\d|2[0-3]):[0-5]\d$/'],
            ]);

            $createdTasks = [];

            // 🔥 Looping buat nyetak tugas ke masing-masing intern yang dipilih
            foreach ($request->uploader_ids as $internId) {
                $task = DailyTask::create([
                    'uploader_id'           => $internId,
                    'division_id'           => $request->division_id,
                    'template_id'           => null, // Urgent task = no template
                    'task_date'             => $request->due_date,
                    'due_date'              => $request->due_date,
                    'description'           => $request->description, // 🔥 BENERIN PENEMPATAN TEKS
                    'status'                => 'pending',
                    'assign_note'           => $request->assign_note,
                    'assigned_by'           => $user->id,
                    'start_time'            => $request->start_time ?? '08:00',
                    'end_time'              => $request->end_time ?? '15:00',
                    'reminder_time'         => $request->reminder_time ?? '14:30',
                ]);

                $createdTasks[] = $task;

                AuditLog::record($user->id, $user->role, 'Buat Tugas Dadakan', $task->toArray(), null, $internId);
            }

            return response()->json([
                'status'  => 'success',
                'message' => count($createdTasks) . ' Tugas urgent berhasil disebar.',
                'data'    => $createdTasks
            ], 201);
        }

        return response()->json(['status' => 'error', 'message' => 'Hak akses tidak valid.'], 403);
    }

    /**
     * Dedicated POST endpoint for intern logbook submission.
     * Validates shift time window per template, handles file upload, mention system.
     */
    public function submit(Request $request, $id)
    {
        $user = Auth::user();
        $task = DailyTask::with('taskTemplate')->findOrFail($id);

        if ($user->role !== 'intern') {
            return response()->json(['status' => 'error', 'message' => 'Hanya intern yang dapat mengirim laporan tugas.'], 403);
        }

        if ($task->uploader_id !== $user->id) {
            return response()->json(['status' => 'error', 'message' => 'Anda tidak bisa mengedit tugas orang lain.'], 403);
        }

        if ($task->status === 'approved') {
            return response()->json(['status' => 'error', 'message' => 'Tugas sudah di-ACC dan tidak dapat diubah.'], 403);
        }

        // ── VALIDASI JAM KERJA (DARI TUGAS LANGSUNG ATAU TEMPLATE) ────────
        $startTimeStr = $task->start_time ?? ($task->taskTemplate?->start_time ?? null);
        $endTimeStr   = $task->end_time ?? ($task->taskTemplate?->end_time ?? null);

        if ($startTimeStr && $endTimeStr) {
            $nowWIB    = Carbon::now('Asia/Jakarta');
            $startTime = Carbon::createFromFormat('H:i', $startTimeStr, 'Asia/Jakarta')->setDate($nowWIB->year, $nowWIB->month, $nowWIB->day);
            $endTime   = Carbon::createFromFormat('H:i', $endTimeStr, 'Asia/Jakarta')->setDate($nowWIB->year, $nowWIB->month, $nowWIB->day);

            if ($nowWIB->lt($startTime) || $nowWIB->gt($endTime)) {
                $taskTitle = $task->title ?? ($task->taskTemplate?->title ?? "Tugas");
                return response()->json([
                    'status'  => 'error',
                    'message' => "Tugas \"{$taskTitle}\" hanya dapat dikerjakan antara jam {$startTimeStr} - {$endTimeStr} WIB.",
                ], 403);
            }
        }

        $request->validate([
            'description'           => 'required|string',
            'evidence_url'          => 'nullable|image|mimes:jpeg,jpg,png,gif,webp|max:10240',
            'confirmed_participants' => 'nullable|string', // JSON string dari FormData
        ]);

        $old_values = $task->toArray();

        // Parse confirmed_participants
        // Parse confirmed_participants
        $participants = [];
        if ($request->has('confirmed_participants')) {
            $decoded = json_decode($request->confirmed_participants, true);
            if (is_array($decoded)) {
                $participants = $decoded;
            }
        }

        // 🔥 FILTER FIX: Cari tau apakah ada rekan yang di-tag (SELAIN diri sendiri)
        $peerParticipants = array_filter($participants, fn($id) => $id !== $user->id);

        $data = [
            'description'            => $request->description,
            'confirmed_participants' => $participants, // Tetap simpan array asli buat riwayat
            'submitted_at'           => now(), // ← Catat waktu pengiriman
        ];

        // ── MENTION / TUGAS BERSAMA ─────────────────────────────────────────
        // 🔥 LOGIC FIX: Sekarang kita ngeceknya ke $peerParticipants, BUKAN $participants
        if (!empty($peerParticipants)) {
            $data['status']               = 'waiting_confirmation';
            $data['mention_submitted_at'] = now();

            // Buat / update tugas rekan yang di-tag
            foreach ($peerParticipants as $participantId) {
                $peer = User::find($participantId);
                if (!$peer) continue;

                $peerTask = DailyTask::firstOrCreate(
                    [
                        'uploader_id' => $participantId,
                        'template_id' => $task->template_id,
                        'task_date'   => $task->task_date,
                    ],
                    [
                        'division_id'   => $peer->division_id,
                        'status'        => 'pending',
                        'assign_note'   => $task->assign_note,
                        'start_time'    => $task->start_time,
                        'end_time'      => $task->end_time,
                        'reminder_time' => $task->reminder_time,
                    ]
                );

                $peerTask->update([
                    'status'                => 'waiting_confirmation',
                    'parent_task_id'        => $task->id,
                    'description'           => $request->description,
                    'division_id'           => $peer->division_id,
                    'mention_submitted_at'  => now(),
                    'submitted_at'          => now(),
                    'confirmed_participants' => [$user->id],
                ]);

                // Kirim notifikasi ke rekan
                Notification::create([
                    'user_id'    => $participantId,
                    'title'      => 'Konfirmasi Tugas Bersama',
                    'message'    => "{$user->full_name} men-tag Anda di tugas bersama. Harap konfirmasi dalam 10 menit!",
                    'type'       => 'warning',
                    'is_read'    => false,
                    'created_at' => now(),
                ]);
            }
        } else {
            $data['status'] = 'pending';
        }
        // Handle image upload
        if ($request->hasFile('evidence_url') && $request->file('evidence_url')->isValid()) {
            $file = $request->file('evidence_url');

            if ($task->evidence_url && $task->status !== 'revision') {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'Bukti foto sudah terkunci dan tidak dapat diubah. Hubungi Admin jika ada kesalahan.'
                ], 403);
            }

            $this->deleteFile($task->evidence_url);

            $filename    = 'task_' . $task->id . '_' . time() . '.jpg';
            $storagePath = 'task_evidence/' . $filename;

            $data['evidence_url'] = $this->uploadFile($file, $storagePath);
        }

        $task->update($data);

        AuditLog::record($user->id, $user->role, 'Submit Logbook', $task->fresh()->toArray(), $old_values);

        $message = empty($participants)
            ? 'Laporan berhasil dikirim. Menunggu persetujuan Admin.'
            : 'Laporan dikirim. Menunggu konfirmasi dari rekan dalam 10 menit.';

        return response()->json([
            'status'  => 'success',
            'message' => $message,
            'data'    => $task->fresh(),
        ]);
    }

    /**
     * Intern confirms being tagged in a collaborative task (ACC Tugas Bersama).
     * PUT /api/daily-tasks/{id}/confirm
     */
    public function confirm(Request $request, $id)
    {
        $user = Auth::user();
        $task = DailyTask::findOrFail($id);

        if ($user->role !== 'intern') {
            return response()->json(['status' => 'error', 'message' => 'Hanya intern yang dapat mengkonfirmasi tugas bersama.'], 403);
        }

        // Pastikan user adalah rekan yang di-tag (child task miliknya)
        if ($task->uploader_id !== $user->id) {
            return response()->json(['status' => 'error', 'message' => 'Ini bukan tugas yang ditujukan untuk Anda.'], 403);
        }

        if ($task->status !== 'waiting_confirmation') {
            return response()->json(['status' => 'error', 'message' => 'Tugas ini tidak dalam status menunggu konfirmasi.'], 422);
        }

        // Cek batas 10 menit
        if (!$task->mention_submitted_at || Carbon::now()->gt($task->mention_submitted_at->addMinutes(10))) {
            // Timeout — reset semua
            $this->resetMentionTask($task);
            return response()->json([
                'status'  => 'error',
                'message' => 'Waktu konfirmasi 10 menit sudah habis. Tugas telah direset.',
            ], 422);
        }

        // ACC — ubah status child dan parent ke pending (siap di-review Admin)
        $now = Carbon::now();
        $task->update([
            'status'               => 'pending',
            'mention_confirmed_at' => $now,
        ]);

        // Update parent task juga
        if ($task->parent_task_id) {
            DailyTask::where('id', $task->parent_task_id)->update([
                'status'               => 'pending',
                'mention_confirmed_at' => $now,
            ]);
        }

        return response()->json([
            'status'  => 'success',
            'message' => 'Tugas bersama dikonfirmasi! Laporan menunggu ACC Admin.',
            'data'    => $task->fresh(),
        ]);
    }

    /**
     * Intern rejects being tagged in a collaborative task.
     * PUT /api/daily-tasks/{id}/reject
     */
    public function reject(Request $request, $id)
    {
        $user = Auth::user();
        $task = DailyTask::findOrFail($id);

        if ($user->role !== 'intern') {
            return response()->json(['status' => 'error', 'message' => 'Hanya intern yang dapat menolak tugas bersama.'], 403);
        }

        if ($task->uploader_id !== $user->id) {
            return response()->json(['status' => 'error', 'message' => 'Ini bukan tugas yang ditujukan untuk Anda.'], 403);
        }

        $this->resetMentionTask($task);

        return response()->json([
            'status'  => 'success',
            'message' => 'Tugas bersama ditolak. Tugas direset ke status Belum Dikerjakan.',
        ]);
    }

    /**
     * Update logbook (User updates progress/photo, Admin approves)
     */
    public function update(Request $request, $id)
    {
        $user = Auth::user();
        $task = DailyTask::findOrFail($id);
        $old_values = $task->toArray();

        if ($user->role === 'intern' && $task->uploader_id !== $user->id) {
            return response()->json(['status' => 'error', 'message' => 'Anda tidak bisa mengedit tugas orang lain.'], 403);
        }
        if ($user->role === 'admin' && $task->division_id !== $user->division_id) {
            return response()->json(['status' => 'error', 'message' => 'Tugas ini di luar divisi Anda.'], 403);
        }

        $request->validate([
            'description'           => 'sometimes|string',
            'status'                => 'sometimes|in:pending,waiting_confirmation,approved,rejected,revision',
            'reject_reason'         => 'nullable|string',
            'evidence_url'          => 'sometimes|image|mimes:jpeg,jpg,png,gif,webp|max:10240',
            'confirmed_participants' => 'sometimes|array',
            'is_archived'           => 'sometimes|boolean',
            'start_time'            => ['nullable', 'string', 'regex:/^([01]\d|2[0-3]):[0-5]\d$/'],
            'end_time'              => ['nullable', 'string', 'regex:/^([01]\d|2[0-3]):[0-5]\d$/'],
            'reminder_time'         => ['nullable', 'string', 'regex:/^([01]\d|2[0-3]):[0-5]\d$/'],
        ]);

        if ($user->role === 'intern' && $request->has('status') && $request->status !== 'pending') {
            return response()->json(['status' => 'error', 'message' => 'Hanya Admin yang berhak memproses logbook.'], 403);
        }

        try {
            $dataToUpdate = $request->except(['evidence_url', '_method']);

            if ($request->hasFile('evidence_url')) {
                $file = $request->file('evidence_url');

                $this->deleteFile($task->evidence_url);

                $filename    = 'task_' . $task->id . '_' . time() . '.jpg';
                $storagePath = 'task_evidence/' . $filename;

                $dataToUpdate['evidence_url'] = $this->uploadFile($file, $storagePath);
            }

            if (in_array($user->role, ['admin', 'super_admin']) && $request->has('status')) {
                $dataToUpdate['evaluated_by'] = $user->id;

                // ── AUTO-APPROVE CHILD TASKS ────────────────────────────────
                // Ketika Admin approve tugas parent, semua child task ikut approved
                if ($request->status === 'approved') {
                    DailyTask::where('parent_task_id', $task->id)->update([
                        'status'       => 'approved',
                        'evaluated_by' => $user->id,
                    ]);
                }
            }

            $task->update($dataToUpdate);

            AuditLog::record(
                $user->id,
                $user->role,
                'Update Logbook',
                $task->fresh()->toArray(),
                $old_values,
                $user->role !== 'intern' ? $task->uploader_id : null
            );

            return response()->json([
                'status'  => 'success',
                'message' => 'Berhasil memperbarui logbook.',
                'data'    => $task
            ]);

        } catch (QueryException $e) {
            if (str_contains($e->getMessage(), 'Akses Ditolak: Bukti foto') || str_contains($e->getMessage(), '[LOCK]')) {
                return response()->json([
                    'status'       => 'error',
                    'message'      => 'Bukti foto sudah dikunci permanen oleh sistem.',
                    'system_error' => 'TRIGGER_EVIDENCE_LOCK'
                ], 403);
            }

            return response()->json([
                'status'  => 'error',
                'message' => 'Terjadi kesalahan sistem database.',
                'debug'   => env('APP_DEBUG') ? $e->getMessage() : null
            ], 500);
        }
    }

    /**
     * Delete logbook
     */
    public function destroy($id)
    {
        $user = Auth::user();
        $task = DailyTask::findOrFail($id);

        if ($user->role === 'intern') {
            return response()->json(['status' => 'error', 'message' => 'Pelatih tidak diizinkan menghapus logbook permanen.'], 403);
        }

        if ($user->role === 'admin' && $task->division_id !== $user->division_id) {
            return response()->json(['status' => 'error', 'message' => 'Anda tidak bisa menghapus tugas divisi lain.'], 403);
        }

        $old_values = $task->toArray();
        $internId   = $task->uploader_id;

        $task->delete();

        AuditLog::record($user->id, $user->role, 'Hapus Logbook', null, $old_values, $internId);

        return response()->json([
            'status'  => 'success',
            'message' => 'Laporan tugas berhasil dihapus.'
        ]);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // PRIVATE HELPERS
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Reset a task (and its paired task) back to "Belum Dikerjakan" state.
     * Wipes description, evidence, and mention metadata.
     */
    private function resetMentionTask(DailyTask $task): void
    {
        $resetData = [
            'status'                => 'pending',
            'description'           => null,
            'confirmed_participants' => [],
            'parent_task_id'        => null,
            'mention_submitted_at'  => null,
            'mention_confirmed_at'  => null,
            'submitted_at'          => null,
        ];

        // Hapus file evidence jika ada
        if ($task->evidence_url) {
            $this->deleteFile($task->evidence_url);
            $resetData['evidence_url'] = null;
        }

        $task->update($resetData);

        // Reset paired task (parent atau child)
        if ($task->parent_task_id) {
            $parent = DailyTask::find($task->parent_task_id);
            if ($parent) $this->resetMentionTask($parent);
        } else {
            // Ini adalah parent — reset semua child-nya
            DailyTask::where('parent_task_id', $task->id)->each(function ($child) {
                $resetChild = [
                    'status'                => 'pending',
                    'description'           => null,
                    'confirmed_participants' => [],
                    'parent_task_id'        => null,
                    'mention_submitted_at'  => null,
                    'mention_confirmed_at'  => null,
                    'submitted_at'          => null,
                ];
                if ($child->evidence_url) {
                    $this->deleteFile($child->evidence_url);
                    $resetChild['evidence_url'] = null;
                }
                $child->update($resetChild);
            });
        }
    }

    /**
     * Helper to upload file dynamically to Supabase S3 or Local storage.
     */
    private function uploadFile($file, string $storagePath): string
    {
        $manager      = new ImageManager(new Driver());
        $image        = $manager->read($file);

        if ($image->width() > 1920) {
            $image->scale(width: 1920);
        }

        $encodedImage = $image->encode(new JpegEncoder(quality: 80));

        if (env('SUPABASE_STORAGE_KEY')) {
            Storage::disk('supabase')->put($storagePath, (string) $encodedImage);
            return env('SUPABASE_STORAGE_URL') . '/' . env('SUPABASE_STORAGE_BUCKET', 'daily-tasks') . '/' . $storagePath;
        } else {
            Storage::disk('public')->put($storagePath, (string) $encodedImage);
            return config('app.url') . Storage::url($storagePath);
        }
    }

    /**
     * Helper to delete file dynamically from Supabase S3 or Local storage.
     */
    private function deleteFile(?string $url): void
    {
        if (!$url) return;

        if (str_contains($url, '/storage/')) {
            $oldPath = str_replace('/storage/', '', parse_url($url, PHP_URL_PATH));
            Storage::disk('public')->delete($oldPath);
        } else {
            $baseUrl = env('SUPABASE_STORAGE_URL');
            if ($baseUrl) {
                $bucket = env('SUPABASE_STORAGE_BUCKET', 'daily-tasks');
                $oldPath = str_replace($baseUrl . '/' . $bucket . '/', '', $url);
                Storage::disk('supabase')->delete($oldPath);
            }
        }
    }
}
