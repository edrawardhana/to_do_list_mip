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
        if (Schema::hasTable('broadcasts') && !Schema::hasColumn('broadcasts', 'target_label')) {
            Schema::table('broadcasts', function (Blueprint $table) {
                $table->string('target_label')->nullable()->after('category');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('broadcasts') && Schema::hasColumn('broadcasts', 'target_label')) {
            Schema::table('broadcasts', function (Blueprint $table) {
                $table->dropColumn('target_label');
            });
        }
    }
};
