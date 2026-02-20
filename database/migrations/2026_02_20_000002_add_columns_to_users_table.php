<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Menambahkan kolom tambahan ke tabel users sesuai ERD.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('shift_id')->nullable()->constrained('shifts')->nullOnDelete();
            $table->string('nama_lengkap')->nullable();
            $table->string('username')->unique()->nullable();
            $table->enum('role', ['admin', 'pegawai'])->default('pegawai');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['shift_id']);
            $table->dropColumn(['shift_id', 'nama_lengkap', 'username', 'role']);
        });
    }
};
