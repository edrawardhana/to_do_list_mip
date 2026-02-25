<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Buat tabel tasks_master (template tugas per divisi).
     */
    public function up(): void
    {
        Schema::create('tasks_master', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('division_id');
            $table->string('task_name');
            $table->string('description')->nullable();

            $table->foreign('division_id')->references('id')->on('divisions')->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tasks_master');
    }
};
