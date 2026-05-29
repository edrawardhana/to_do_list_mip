<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Hapus constraint lama dan buat baru dengan tambahan tipe 'terlambat' dan 'pulang_awal'
        DB::statement("ALTER TABLE exceptions DROP CONSTRAINT IF EXISTS exceptions_type_check");
        DB::statement("ALTER TABLE exceptions ADD CONSTRAINT exceptions_type_check CHECK (type IN ('sakit', 'izin', 'tugas_luar', 'swap_shift', 'terlambat', 'pulang_awal'))");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("ALTER TABLE exceptions DROP CONSTRAINT IF EXISTS exceptions_type_check");
        DB::statement("ALTER TABLE exceptions ADD CONSTRAINT exceptions_type_check CHECK (type IN ('sakit', 'izin', 'tugas_luar', 'swap_shift'))");
    }
};
