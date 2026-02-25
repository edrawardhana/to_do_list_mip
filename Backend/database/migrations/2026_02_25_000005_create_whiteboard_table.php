<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Buat tabel whiteboard.
     */
    public function up(): void
    {
        Schema::create('whiteboard', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('title');
            $table->text('content')->nullable();
            $table->string('category')->nullable();   // Setup VR, Digisign, etc
            $table->uuid('division_id')->nullable();
            $table->uuid('created_by')->nullable();
            $table->timestamp('updated_at')->nullable();

            $table->foreign('division_id')->references('id')->on('divisions')->nullOnDelete();
            $table->foreign('created_by')->references('id')->on('users')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('whiteboard');
    }
};
