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
        Schema::table('whiteboards', function (Blueprint $table) {
            // Kita pakai tipe JSON biar rapi nyimpen array checklist-nya
            // nullable() wajib biar data SOP lama nggak error karena kolom ini kosong
            $table->json('ai_breakdown')->nullable(); 
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('whiteboards', function (Blueprint $table) {
            $table->dropColumn('ai_breakdown');
        });
    }
};
