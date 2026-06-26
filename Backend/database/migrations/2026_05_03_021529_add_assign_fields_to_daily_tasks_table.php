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
        Schema::table('daily_tasks', function (Blueprint $table) {
            if (!Schema::hasColumn('daily_tasks', 'assign_note')) {
                $table->text('assign_note')->nullable()->after('is_archived');
            }
            if (!Schema::hasColumn('daily_tasks', 'assigned_by')) {
                $table->foreignUuid('assigned_by')->nullable()->after('assign_note')->constrained('profiles')->nullOnDelete();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('daily_tasks', function (Blueprint $table) {
            $table->dropForeign(['assigned_by']);
            $table->dropColumn(['assign_note', 'assigned_by']);
        });
    }
};
