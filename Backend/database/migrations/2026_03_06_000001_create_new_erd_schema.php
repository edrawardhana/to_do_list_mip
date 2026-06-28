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
        Schema::dropIfExists('schedules');
        Schema::dropIfExists('exceptions');
        Schema::dropIfExists('system_configs');
        Schema::dropIfExists('whiteboards');
        Schema::dropIfExists('task_templates');
        Schema::dropIfExists('profiles');
        Schema::enableForeignKeyConstraints();

        // 2. Create divisions
        Schema::create('divisions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->text('description')->nullable();
            $table->timestampTz('created_at')->useCurrent();
        });

        // 3. Create profiles
        Schema::create('profiles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('division_id')->nullable()->constrained('divisions')->nullOnDelete();
            $table->string('full_name');
            $table->string('nickname')->nullable();
            $table->string('email')->unique();
            $table->enum('role', ['intern', 'admin', 'super_admin', 'developer']);
            $table->enum('shift', ['pagi', 'middle', 'siang'])->default('pagi');
            $table->boolean('is_verified')->default(false);
            $table->boolean('is_locked')->default(false);
            $table->text('avatar_url')->nullable();
            $table->string('phone_number', 20)->nullable();
            $table->timestampsTz();
        });

        // 4. Create task_templates
        Schema::create('task_templates', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('division_id')->constrained('divisions')->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestampTz('created_at')->useCurrent();
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
            $table->foreignUuid('uploader_id')->constrained('profiles')->cascadeOnDelete();
            $table->foreignUuid('division_id')->constrained('divisions')->cascadeOnDelete();
            $table->foreignUuid('template_id')->constrained('task_templates')->cascadeOnDelete();
            $table->date('task_date');
            $table->text('description')->nullable();
            $table->enum('status', ['pending', 'approved', 'rejected', 'revision'])->default('pending');
            $table->text('evidence_url')->nullable();
            $table->timestampTz('captured_at')->nullable();
            $table->json('confirmed_participants')->nullable();
            $table->foreignUuid('evaluated_by')->nullable()->constrained('profiles')->nullOnDelete();
            $table->text('reject_reason')->nullable();
            $table->boolean('is_archived')->default(false);
            $table->text('assign_note')->nullable(); // Note dari admin saat assign task
            $table->foreignUuid('assigned_by')->nullable()->constrained('profiles')->nullOnDelete(); // Admin yang assign
            $table->timestampsTz();
        });

        // 7. Create schedules
        Schema::create('schedules', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('profiles')->cascadeOnDelete();
            $table->date('shift_date');
            $table->string('shift_type', 50);
            $table->timestampTz('created_at')->useCurrent();
            $table->unique(['user_id', 'shift_date']);
        });

        // 8. Create exceptions
        Schema::create('exceptions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('profiles')->cascadeOnDelete();
            $table->foreignUuid('evaluated_by')->nullable()->constrained('profiles')->nullOnDelete();
            $table->date('permission_date');
            $table->date('replacement_date')->nullable();
            $table->string('type', 50);
            $table->text('evidence_url')->nullable();
            $table->text('description');
            $table->string('status', 50)->default('pending');
            $table->timestampTz('created_at')->useCurrent();
            $table->timestampTz('processed_at')->nullable();
        });

        // 9. Create system_configs
        Schema::create('system_configs', function (Blueprint $table) {
            $table->string('key', 100)->primary();
            $table->text('value');
            $table->timestampTz('updated_at')->useCurrent();
        });

        // 10. Create audit_logs
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('actor_id')->constrained('profiles')->cascadeOnDelete();
            $table->string('actor_role', 50);
            $table->foreignUuid('target_user_id')->nullable()->constrained('profiles')->nullOnDelete();
            $table->string('action', 255);
            $table->jsonb('old_values')->nullable();
            $table->jsonb('new_values')->nullable();
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
        Schema::dropIfExists('schedules');
        Schema::dropIfExists('exceptions');
        Schema::dropIfExists('system_configs');
        Schema::dropIfExists('daily_tasks');
        Schema::dropIfExists('whiteboards');
        Schema::dropIfExists('task_templates');
        Schema::dropIfExists('profiles');
        Schema::dropIfExists('divisions');
        Schema::enableForeignKeyConstraints();
    }
};
