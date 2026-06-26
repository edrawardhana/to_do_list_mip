<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Drop the old daily_tasks_status_check constraint if it exists
        if (DB::getDriverName() !== 'sqlite') {
            DB::statement("ALTER TABLE daily_tasks DROP CONSTRAINT IF EXISTS daily_tasks_status_check");
            // Add the updated daily_tasks_status_check constraint supporting 'waiting_confirmation'
            DB::statement("ALTER TABLE daily_tasks ADD CONSTRAINT daily_tasks_status_check CHECK (status IN ('pending', 'approved', 'rejected', 'revision', 'waiting_confirmation'))");
        }
    }

    public function down(): void
    {
        // Revert status check constraint
        if (DB::getDriverName() !== 'sqlite') {
            DB::statement("ALTER TABLE daily_tasks DROP CONSTRAINT IF EXISTS daily_tasks_status_check");
            DB::statement("ALTER TABLE daily_tasks ADD CONSTRAINT daily_tasks_status_check CHECK (status IN ('pending', 'approved', 'rejected', 'revision'))");
        }
    }
};
