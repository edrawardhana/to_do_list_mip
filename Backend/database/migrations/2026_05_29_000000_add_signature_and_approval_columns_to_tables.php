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
        // 1. Tambah kolom signature_url dan stamp_url pada tabel profiles
        Schema::table('profiles', function (Blueprint $table) {
            $table->string('signature_url')->nullable()->after('avatar_url');
            $table->string('stamp_url')->nullable()->after('signature_url');
        });

        // 2. Tambah kolom persetujuan tingkat manager & spv pada tabel exceptions
        Schema::table('exceptions', function (Blueprint $table) {
            $table->uuid('manager_approved_by')->nullable()->after('evaluated_by');
            $table->timestamp('manager_approved_at')->nullable()->after('manager_approved_by');
            $table->uuid('spv_approved_by')->nullable()->after('manager_approved_at');
            $table->timestamp('spv_approved_at')->nullable()->after('spv_approved_by');

            // Foreign keys
            $table->foreign('manager_approved_by')->references('id')->on('profiles')->onDelete('set null');
            $table->foreign('spv_approved_by')->references('id')->on('profiles')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('exceptions', function (Blueprint $table) {
            $table->dropForeign(['manager_approved_by']);
            $table->dropForeign(['spv_approved_by']);
            $table->dropColumn(['manager_approved_by', 'manager_approved_at', 'spv_approved_by', 'spv_approved_at']);
        });

        Schema::table('profiles', function (Blueprint $table) {
            $table->dropColumn(['signature_url', 'stamp_url']);
        });
    }
};
