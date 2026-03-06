<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Drop old tables if exist to ensure clean slate (ignore foreign key constraint for dropping)
        Schema::disableForeignKeyConstraints();
        Schema::dropIfExists('broadcasts');
        Schema::dropIfExists('shift_swaps');
        Schema::dropIfExists('logbook_entries');
        Schema::dropIfExists('whiteboard');
        Schema::dropIfExists('tasks_master');
        Schema::dropIfExists('users');
        Schema::dropIfExists('divisions');
        
        // Also drop if the new ones exist, just in case
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('daily_tasks');
        Schema::dropIfExists('attendance_schedules');
        Schema::dropIfExists('whiteboards');
        Schema::dropIfExists('task_templates');
        Schema::dropIfExists('profiles');
        Schema::enableForeignKeyConstraints();

        // 2. Create divisions
        Schema::create('divisions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
        });

        // 3. Create profiles
        Schema::create('profiles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('division_id')->constrained('divisions')->cascadeOnDelete();
            $table->string('full_name');
            $table->string('email')->unique();
            $table->enum('role', ['user', 'admin', 'super_admin', 'developer']);
            $table->enum('shift', ['pagi', 'middle', 'siang']);
            $table->boolean('is_locked')->default(false);
        });

        // 4. Create task_templates
        Schema::create('task_templates', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('division_id')->constrained('divisions')->cascadeOnDelete();
            $table->string('task_name');
        });

        // 5. Create whiteboards
        Schema::create('whiteboards', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('division_id')->constrained('divisions')->cascadeOnDelete();
            $table->string('title');
            $table->text('content_url');
            $table->enum('type', ['SOP', 'Tutorial', 'Asset']);
        });

        // 6. Create daily_tasks
        Schema::create('daily_tasks', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('profiles')->cascadeOnDelete();
            $table->foreignUuid('division_id')->constrained('divisions')->cascadeOnDelete();
            $table->foreignUuid('task_template_id')->constrained('task_templates')->cascadeOnDelete();
            $table->string('task_name');
            $table->string('evidence_url')->nullable();
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->uuid('first_uploader_id')->nullable();
            $table->foreign('first_uploader_id')->references('id')->on('profiles')->nullOnDelete();
            $table->timestampTz('created_at')->useCurrent();
        });

        // 7. Create attendance_schedules
        Schema::create('attendance_schedules', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('profiles')->cascadeOnDelete();
            $table->enum('type', ['Izin', 'Sakit', 'Swap', 'Libur']);
            $table->date('start_date');
            $table->date('end_date');
            $table->string('proof_url')->nullable();
            $table->boolean('is_approved')->default(false); // ERD says Default: TRUE for Libur. We'll handle this in logic or default false here.
        });

        // 8. Create audit_logs
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('actor_id')->constrained('profiles')->cascadeOnDelete();
            $table->uuid('target_id'); // Can be any entity ID, not strictly constrained to one table
            $table->string('action_type');
            $table->text('details');
            $table->timestampTz('created_at')->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::disableForeignKeyConstraints();
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('attendance_schedules');
        Schema::dropIfExists('daily_tasks');
        Schema::dropIfExists('whiteboards');
        Schema::dropIfExists('task_templates');
        Schema::dropIfExists('profiles');
        Schema::dropIfExists('divisions');
        Schema::enableForeignKeyConstraints();
    }
};
