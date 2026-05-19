<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('daily_tasks', function (Blueprint $table) {
            if (!Schema::hasColumn('daily_tasks', 'start_time')) {
                $table->string('start_time', 5)->nullable()->default('08:00')->after('assign_note')
                    ->comment('Format HH:MM WIB - waktu mulai intern boleh mengerjakan tugas ini');
            }
            if (!Schema::hasColumn('daily_tasks', 'end_time')) {
                $table->string('end_time', 5)->nullable()->default('15:00')->after('start_time')
                    ->comment('Format HH:MM WIB - batas akhir pengiriman laporan');
            }
            if (!Schema::hasColumn('daily_tasks', 'reminder_time')) {
                $table->string('reminder_time', 5)->nullable()->default('14:30')->after('end_time')
                    ->comment('Format HH:MM WIB - jam notifikasi pengingat otomatis dikirim');
            }
        });
    }

    public function down(): void
    {
        Schema::table('daily_tasks', function (Blueprint $table) {
            $table->dropColumn(['start_time', 'end_time', 'reminder_time']);
        });
    }
};
