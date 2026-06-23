<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\DailyTask; 

class CleanupExpiredTasks extends Command
{
    /**
     * Nama command buat dipanggil di terminal
     */
    protected $signature = 'app:cleanup-expired-tasks';

    /**
     * Deskripsi command biar rapi pas di-cek lewat 'php artisan list'
     */
    protected $description = 'Hapus tugas harian/urgent yang udah expired > 3 hari dan gak dikerjain intern';

    /**
     * Eksekusi pembersihan
     */
    public function handle()
    {
        // Bantai tugas yang umurnya > 3 hari, blm dikerjakan (evidence_url null), dan status pending
        $deletedRows = DailyTask::where('status', 'pending')
            ->whereNull('evidence_url')
            ->whereDate('task_date', '<', now()->subDays(3))
            ->delete();

        $this->info("Berhasil menghapus {$deletedRows} tugas sampah dari database brok!");
    }
}