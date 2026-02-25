<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Buat tabel broadcasts (pengumuman dari admin).
     */
    public function up(): void
    {
        Schema::create('broadcasts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('admin_id');
            $table->uuid('target_division_id')->nullable(); // Null jika global
            $table->text('message');
            $table->timestamp('created_at')->nullable();

            $table->foreign('admin_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('target_division_id')->references('id')->on('divisions')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('broadcasts');
    }
};
