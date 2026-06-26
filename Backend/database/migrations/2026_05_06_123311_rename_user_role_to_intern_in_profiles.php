<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Rename role 'user' → 'intern' in profiles table.
     * Also updates the CHECK constraint to remove 'user' from allowed values.
     */
    public function up(): void
    {
        // 1. Update existing rows: 'user' → 'intern'
        DB::statement("UPDATE profiles SET role = 'intern' WHERE role = 'user'");

        // 2. Drop old CHECK constraint (PostgreSQL)
        if (DB::getDriverName() !== 'sqlite') {
            DB::statement("ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check");
            DB::statement("UPDATE profiles SET role = 'intern' WHERE role = 'user'");
            DB::statement("ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('intern', 'admin', 'super_admin', 'developer'))");
        }
    }

    public function down(): void
    {
        // Revert: drop new constraint, add old one back, rename rows
        if (DB::getDriverName() !== 'sqlite') {
            DB::statement("ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check");
            DB::statement("ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('user', 'intern', 'admin', 'super_admin', 'developer'))");
        }
        DB::statement("UPDATE profiles SET role = 'user' WHERE role = 'intern'");
    }
};
