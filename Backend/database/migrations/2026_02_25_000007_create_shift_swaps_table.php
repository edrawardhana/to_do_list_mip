<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Buat tabel shift_swaps (request tukar shift antar user).
     */
    public function up(): void
    {
        Schema::create('shift_swaps', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('requester_id');
            $table->uuid('target_user_id');
            $table->date('swap_date');
            $table->string('reason_screenshot_url')->nullable();
            $table->string('status')->default('Pending'); // Pending, Approved, Rejected
            $table->uuid('approved_by')->nullable();

            $table->foreign('requester_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('target_user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('approved_by')->references('id')->on('users')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('shift_swaps');
    }
};
