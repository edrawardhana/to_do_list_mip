<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Buat tabel users baru dengan UUID dan kolom sesuai ERD.
     */
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('full_name');
            $table->string('email')->unique();
            $table->string('password_hash');
            $table->string('role')->default('Intern');  // Intern, Admin, SuperAdmin
            $table->uuid('division_id')->nullable();
            $table->string('shift_type')->nullable();   // Morning, Afternoon
            $table->boolean('is_locked')->default(false); // Hard Lock Feature
            $table->string('status')->default('Pending'); // Pending, Active, Finished
            $table->timestamp('created_at')->nullable();

            $table->foreign('division_id')->references('id')->on('divisions')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
