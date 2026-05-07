<?php

namespace App\Http\Controllers;

use App\Models\DailyTask;
use App\Models\TaskTemplate;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Database\QueryException;
use App\Models\AuditLog;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;
use Intervention\Image\Encoders\JpegEncoder;
use Illuminate\Support\Str;

class DailyTaskController extends Controller
{
    /**
     * Get Logbook data with Data Isolation
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        
        // AUTO GENERATE TASKS FOR INTERN
        // If the user is an intern, ensure all active templates for their division are instantiated for today.
        if ($user->role === 'intern' && $user->division_id) {
            $today = now()->toDateString();
            $templates = TaskTemplate::where('division_id', $user->division_id)
                ->where('is_active', true)
                ->get();
            
            foreach ($templates as $template) {
                // Using firstOrCreate to ensure idempotency (tasks only created once per day per template)
                DailyTask::firstOrCreate(
                    [
                        'template_id' => $template->id,
                        'uploader_id' => $user->id,
                        'task_date'   => $today,
                    ],
                    [
                        'division_id' => $user->division_id,
                        'status'      => 'pending',
                        'assign_note' => $template->description,
                    ]
                );
            }
        }

        $query = DailyTask::with(['taskTemplate', 'uploader', 'evaluator', 'assignedBy']);

        if ($user->role === 'intern') {
            // Intern only sees their own tasks
            $query->where('uploader_id', $user->id);
        } elseif ($user->role === 'admin') {
            // Admin sees tasks from their entire division
            $query->where('division_id', $user->division_id);
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

        $tasks = $query->orderBy('created_at', 'desc')->get();

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
            'data' => $tasks
        ]);
    }

    /**
     * Admin assigns task to specific intern(s)
     */
    public function assignTask(Request $request)
    {
        $user = Auth::user();

        // Only admin and super_admin can assign tasks
        if (!in_array($user->role, ['admin', 'super_admin'])) {
            return response()->json([
                'status' => 'error',
                'message' => 'Hanya Admin yang dapat membagikan tugas.'
            ], 403);
        }

        $request->validate([
            'template_id' => 'required|uuid|exists:task_templates,id',
            'intern_ids' => 'required|array|min:1',
            'intern_ids.*' => 'uuid|exists:profiles,id',
            'task_date' => 'required|date',
            'assign_note' => 'nullable|string|max:500',
        ]);

        $template = TaskTemplate::findOrFail($request->template_id);

        // Admin can only assign tasks within their division
        if ($user->role === 'admin' && $template->division_id !== $user->division_id) {
            return response()->json([
                'status' => 'error',
                'message' => 'Anda hanya dapat membagikan tugas dalam divisi Anda.'
            ], 403);
        }

        $createdTasks = [];
        $errors = [];

        foreach ($request->intern_ids as $internId) {
            $intern = User::find($internId);

            // Verify intern is in the same division
            if ($user->role === 'admin' && $intern->division_id !== $user->division_id) {
                $errors[] = "Intern {$intern->full_name} tidak dalam divisi Anda.";
                continue;
            }

            // Check if task already exists for this intern on this date
            $existingTask = DailyTask::where('uploader_id', $internId)
                ->where('template_id', $request->template_id)
                ->where('task_date', $request->task_date)
                ->first();

            if ($existingTask) {
                $errors[] = "Tugas sudah ada untuk {$intern->full_name} pada tanggal ini.";
                continue;
            }

            // Create task
            $task = DailyTask::create([
                'uploader_id' => $internId,
                'division_id' => $template->division_id,
                'template_id' => $request->template_id,
                'task_date' => $request->task_date,
                'status' => 'pending',
                'assign_note' => $request->assign_note ?? $template->description,
                'assigned_by' => $user->id,
            ]);

            $createdTasks[] = $task;

            // Log audit
            AuditLog::record(
                $user->id,
                $user->role,
                'Assign Task ke Intern',
                $task->toArray(),
                null,
                $internId
            );
        }

        return response()->json([
            'status' => 'success',
            'message' => count($createdTasks) . ' tugas berhasil dibagikan.',
            'data' => [
                'created_tasks' => $createdTasks,
                'errors' => $errors
            ]
        ], 201);
    }

    /**
     * Create new Task/Logbook
     */
    public function store(Request $request)
    {
        $user = Auth::user();

        // Only interns can create logbook tasks for themselves
        if ($user->role !== 'intern') {
            return response()->json(['status' => 'error', 'message' => 'Hanya intern yang dapat membuat tugas logbook.'], 403);
        }

        $request->validate([
            'template_id' => 'required|uuid',
            'task_date' => 'required|date',
            'description' => 'nullable|string',
            'evidence_url' => 'nullable|string',
            'confirmed_participants' => 'nullable|array',
            'captured_at' => 'nullable|date'
        ]);

        $task = DailyTask::create([
            'uploader_id' => $user->id,
            'division_id' => $user->division_id,
            'template_id' => $request->template_id,
            'task_date' => $request->task_date,
            'description' => $request->description,
            'status' => 'pending', 
            'evidence_url' => $request->evidence_url,
            'confirmed_participants' => $request->confirmed_participants ?? [],
            'captured_at' => $request->captured_at
        ]);

        AuditLog::record(
            $user->id, 
            $user->role, 
            'Buat Logbook', 
            $task->toArray()
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Berhasil membuat logbook tugas.',
            'data' => $task
        ], 201);
    }

    /**
     * Dedicated POST endpoint for intern logbook submission (supports file upload via real POST).
     * This avoids the PHP limitation where $_FILES is empty on PUT/PATCH requests.
     * Supports image compression for evidence photos.
     */
    public function submit(Request $request, $id)
    {
        $user = Auth::user();
        $task = DailyTask::findOrFail($id);

        // Only interns / users can submit logbook (admins use update() for approval)
        if ($user->role !== 'intern') {
            return response()->json(['status' => 'error', 'message' => 'Hanya intern yang dapat mengirim laporan tugas.'], 403);
        }

        // Only the task owner can submit
        if ($task->uploader_id !== $user->id) {
            return response()->json(['status' => 'error', 'message' => 'Anda tidak bisa mengedit tugas orang lain.'], 403);
        }

        // Already approved — don't allow re-submission
        if ($task->status === 'approved') {
            return response()->json(['status' => 'error', 'message' => 'Tugas sudah di-ACC dan tidak dapat diubah.'], 403);
        }

        $request->validate([
            'description'             => 'required|string',
            'evidence_url'            => 'nullable|image|mimes:jpeg,jpg,png,gif,webp|max:10240',
            'confirmed_participants'  => 'nullable|string', // JSON string dari FormData
        ]);

        $old_values = $task->toArray();

        // Parse confirmed_participants — dikirim sebagai JSON string dari FormData
        $participants = [];
        if ($request->has('confirmed_participants')) {
            $decoded = json_decode($request->confirmed_participants, true);
            if (is_array($decoded)) {
                $participants = $decoded;
            }
        }

        $data = [
            'description'            => $request->description,
            'status'                 => 'pending',
            'confirmed_participants' => $participants,
        ];

        // Handle image upload with compression
        if ($request->hasFile('evidence_url') && $request->file('evidence_url')->isValid()) {
            $file = $request->file('evidence_url');
            
            // Block re-upload ONLY if already has evidence AND task is NOT in revision status
            // Revision tasks are explicitly allowed to replace their evidence photo
            if ($task->evidence_url && $task->status !== 'revision') {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Bukti foto sudah terkunci dan tidak dapat diubah. Hubungi Admin jika ada kesalahan.'
                ], 403);
            }

            // Delete old evidence file if replacing (revision case)
            if ($task->evidence_url) {
                $oldPath = str_replace('/storage/', '', parse_url($task->evidence_url, PHP_URL_PATH));
                Storage::disk('public')->delete($oldPath);
            }

            // Generate unique filename
            $filename = 'task_' . $task->id . '_' . time() . '.jpg';
            $storagePath = 'task_evidence/' . $filename;
            
            // Compress and save image using ImageManager
            $manager = new ImageManager(new Driver());
            $image = $manager->decode($file);
            
            // Resize if image is too large (max width 1920px, maintain aspect ratio)
            if ($image->width() > 1920) {
                $image->scale(width: 1920);
            }
            
            // Encode to JPEG with 80% quality for compression
            $encodedImage = $image->encode(new JpegEncoder(quality: 80));
            
            // Save to storage
            Storage::disk('public')->put($storagePath, (string) $encodedImage);
            
            // Generate full URL for frontend access
            $data['evidence_url'] = config('app.url') . Storage::url($storagePath);
        }

        $task->update($data);

        AuditLog::record(
            $user->id,
            $user->role,
            'Submit Logbook',
            $task->fresh()->toArray(),
            $old_values
        );

        return response()->json([
            'status'  => 'success',
            'message' => 'Laporan berhasil dikirim. Menunggu persetujuan Admin.',
            'data'    => $task->fresh(),
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

        // Security: Ensure User only edits their own, Admin only edits their division's
        if ($user->role === 'intern' && $task->uploader_id !== $user->id) {
            return response()->json(['status' => 'error', 'message' => 'Anda tidak bisa mengedit tugas orang lain.'], 403);
        }
        if ($user->role === 'admin' && $task->division_id !== $user->division_id) {
            return response()->json(['status' => 'error', 'message' => 'Tugas ini di luar divisi Anda.'], 403);
        }

        $request->validate([
            'description'           => 'sometimes|string',
            'status'                => 'sometimes|in:pending,approved,rejected,revision',
            'reject_reason'         => 'nullable|string',
            'evidence_url'          => 'sometimes|image|mimes:jpeg,jpg,png,gif,webp|max:10240', // 10MB, image only
            'confirmed_participants' => 'sometimes|array',
            'is_archived'           => 'sometimes|boolean'
        ]);

        // Non-admin shouldn't change status to approved/rejected/revision
        if ($user->role === 'intern' && $request->has('status') && $request->status !== 'pending') {
             return response()->json(['status' => 'error', 'message' => 'Hanya Admin yang berhak memproses logbook.'], 403);
        }

        try {
            // Get all data except the file and method spoofing
            $dataToUpdate = $request->except(['evidence_url', '_method']);

            // Handle image upload with compression for 'evidence_url' if it exists
            if ($request->hasFile('evidence_url')) {
                $file = $request->file('evidence_url');
                
                // Delete old evidence if exists
                if ($task->evidence_url) {
                    $oldPath = str_replace('/storage/', '', parse_url($task->evidence_url, PHP_URL_PATH));
                    Storage::disk('public')->delete($oldPath);
                }

                // Generate unique filename
                $filename = 'task_' . $task->id . '_' . time() . '.jpg';
                $storagePath = 'task_evidence/' . $filename;
                
                // Compress and save image using ImageManager
                $manager = new ImageManager(new Driver());
                $image = $manager->decode($file);
                
                // Resize if image is too large (max width 1920px, maintain aspect ratio)
                if ($image->width() > 1920) {
                    $image->scale(width: 1920);
                }
                
                // Encode to JPEG with 80% quality for compression
                $encodedImage = $image->encode(new JpegEncoder(quality: 80));
                
                // Save to storage
                Storage::disk('public')->put($storagePath, (string) $encodedImage);
                
                // Generate full URL for frontend access
                $dataToUpdate['evidence_url'] = config('app.url') . Storage::url($storagePath);
            }
            
            // Mark evaluated_by if admin processed it
            if ($user->role === 'admin' || $user->role === 'super_admin') {
                if ($request->has('status')) {
                    $dataToUpdate['evaluated_by'] = $user->id;
                }
            }

            $task->update($dataToUpdate);

            AuditLog::record(
                $user->id, 
                $user->role, 
                'Update Logbook', 
                $task->fresh()->toArray(), 
                $old_values,
                $user->role !== 'intern' ? $task->uploader_id : null // Target is the intern if admin is acting
            );

            return response()->json([
                'status' => 'success',
                'message' => 'Berhasil memperbarui logbook.',
                'data' => $task
            ]);

        } catch (QueryException $e) {
            if (str_contains($e->getMessage(), 'Akses Ditolak: Bukti foto')) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Bukti foto sudah dikunci permanen oleh sistem dan tidak dapat diubah lagi. Hubungi Admin Jika ada keliruan.',
                    'system_error' => 'TRIGGER_EVIDENCE_LOCK'
                ], 403);
            }

            return response()->json([
                'status' => 'error',
                'message' => 'Terjadi kesalahan sistem database.',
                'debug' => env('APP_DEBUG') ? $e->getMessage() : null
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

        // Simpan state sebelum dihapus untuk Audit Log
        $old_values = $task->toArray();
        $internId = $task->uploader_id;
        
        $task->delete();

        AuditLog::record(
            $user->id, 
            $user->role, 
            'Hapus Logbook', 
            null, 
            $old_values, 
            $internId
        );

        return response()->json([
            'status' => 'success',
            'message' => 'Laporan tugas berhasil dihapus.'
        ]);
    }
}
