<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // ── 1. profiles: tambah internship_batch, hapus role developer ─────
        Schema::table('profiles', function (Blueprint $table) {
            if (!Schema::hasColumn('profiles', 'internship_batch')) {
                $table->string('internship_batch')->nullable()->after('role');
            }
        });

        // Downgrade any existing developer accounts to super_admin FIRST
        DB::statement("UPDATE profiles SET role = 'super_admin' WHERE role = 'developer'");

        // Update role CHECK constraint: hapus 'developer'
        if (DB::getDriverName() !== 'sqlite') {
            DB::statement("ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check");
            DB::statement("ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('intern', 'admin', 'super_admin'))");
        }

        // ── 2. task_templates: tambah start_time, end_time, reminder_time ──
        Schema::table('task_templates', function (Blueprint $table) {
            if (!Schema::hasColumn('task_templates', 'start_time')) {
                $table->string('start_time', 5)->nullable()->default('08:00')->after('is_active')
                    ->comment('Format HH:MM WIB - waktu mulai intern boleh mengerjakan tugas ini');
            }
            if (!Schema::hasColumn('task_templates', 'end_time')) {
                $table->string('end_time', 5)->nullable()->default('15:00')->after('start_time')
                    ->comment('Format HH:MM WIB - batas akhir pengiriman laporan');
            }
            if (!Schema::hasColumn('task_templates', 'reminder_time')) {
                $table->string('reminder_time', 5)->nullable()->default('14:30')->after('end_time')
                    ->comment('Format HH:MM WIB - jam notifikasi pengingat otomatis dikirim');
            }
        });

        // ── 3. daily_tasks: tambah kolom untuk mention system & submitted_at ─
        Schema::table('daily_tasks', function (Blueprint $table) {
            if (!Schema::hasColumn('daily_tasks', 'parent_task_id')) {
                $table->uuid('parent_task_id')->nullable()->after('id')
                    ->comment('ID tugas utama (pengirim pertama) untuk tugas bersama');
                $table->foreign('parent_task_id')->references('id')->on('daily_tasks')->onDelete('set null');
            }
            if (!Schema::hasColumn('daily_tasks', 'mention_submitted_at')) {
                $table->timestampTz('mention_submitted_at')->nullable()->after('parent_task_id')
                    ->comment('Waktu intern pertama kali mengirim dengan tag rekan');
            }
            if (!Schema::hasColumn('daily_tasks', 'mention_confirmed_at')) {
                $table->timestampTz('mention_confirmed_at')->nullable()->after('mention_submitted_at')
                    ->comment('Waktu rekan yang di-tag melakukan konfirmasi ACC');
            }
            if (!Schema::hasColumn('daily_tasks', 'submitted_at')) {
                $table->timestampTz('submitted_at')->nullable()->after('mention_confirmed_at')
                    ->comment('Waktu persis intern mengirimkan laporan (untuk sorting & transparansi)');
            }
        });

        // ── 4. schedules: tambah dukungan shift 'middle' ───────────────────
        if (DB::getDriverName() !== 'sqlite') {
            DB::statement("ALTER TABLE schedules DROP CONSTRAINT IF EXISTS schedules_shift_type_check");
            DB::statement("ALTER TABLE schedules ADD CONSTRAINT schedules_shift_type_check CHECK (shift_type IN ('morning', 'middle', 'afternoon', 'full'))");
        }
    }

    public function down(): void
    {
        // Restore developer role
        if (DB::getDriverName() !== 'sqlite') {
            DB::statement("ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check");
            DB::statement("ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('intern', 'admin', 'super_admin', 'developer'))");
        }

        Schema::table('profiles', function (Blueprint $table) {
            $table->dropColumn('internship_batch');
        });

        Schema::table('task_templates', function (Blueprint $table) {
            $table->dropColumn(['start_time', 'end_time', 'reminder_time']);
        });

        Schema::table('daily_tasks', function (Blueprint $table) {
            $table->dropForeign(['parent_task_id']);
            $table->dropColumn(['parent_task_id', 'mention_submitted_at', 'mention_confirmed_at', 'submitted_at']);
        });

        if (DB::getDriverName() !== 'sqlite') {
            DB::statement("ALTER TABLE schedules DROP CONSTRAINT IF EXISTS schedules_shift_type_check");
            DB::statement("ALTER TABLE schedules ADD CONSTRAINT schedules_shift_type_check CHECK (shift_type IN ('morning', 'afternoon', 'full'))");
        }
    }
};
