<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Update the fn_generate_daily_tasks trigger function to copy start_time, end_time, and reminder_time
        DB::unprepared("
            CREATE OR REPLACE FUNCTION fn_generate_daily_tasks()
            RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
            BEGIN
                INSERT INTO public.daily_tasks
                    (uploader_id, division_id, template_id, status, task_date, start_time, end_time, reminder_time)
                SELECT
                    p.id, p.division_id, t.id, 'pending', CURRENT_DATE, t.start_time, t.end_time, t.reminder_time
                FROM public.profiles p
                JOIN public.task_templates t ON p.division_id = t.division_id
                WHERE p.role = 'intern'
                  AND p.is_verified = true
                  AND p.division_id IS NOT NULL
                  AND t.is_active = true
                  AND NOT EXISTS (
                      SELECT 1 FROM public.exceptions e
                      WHERE e.user_id = p.id
                        AND e.status = 'approved'
                        AND e.type IN ('izin', 'sakit', 'tugas_luar')
                        AND e.permission_date = CURRENT_DATE
                  )
                  AND NOT EXISTS (
                      SELECT 1 FROM public.daily_tasks d
                      WHERE d.uploader_id = p.id
                        AND d.template_id = t.id
                        AND d.task_date = CURRENT_DATE
                  );
            END;
            $$;
        ");
    }

    public function down(): void
    {
        // Revert to original generate logic without explicit time columns
        DB::unprepared("
            CREATE OR REPLACE FUNCTION fn_generate_daily_tasks()
            RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
            BEGIN
                INSERT INTO public.daily_tasks
                    (uploader_id, division_id, template_id, status, task_date)
                SELECT
                    p.id, p.division_id, t.id, 'pending', CURRENT_DATE
                FROM public.profiles p
                JOIN public.task_templates t ON p.division_id = t.division_id
                WHERE p.role = 'intern'
                  AND p.is_verified = true
                  AND p.division_id IS NOT NULL
                  AND t.is_active = true
                  AND NOT EXISTS (
                      SELECT 1 FROM public.exceptions e
                      WHERE e.user_id = p.id
                        AND e.status = 'approved'
                        AND e.type IN ('izin', 'sakit', 'tugas_luar')
                        AND e.permission_date = CURRENT_DATE
                  )
                  AND NOT EXISTS (
                      SELECT 1 FROM public.daily_tasks d
                      WHERE d.uploader_id = p.id
                        AND d.template_id = t.id
                        AND d.task_date = CURRENT_DATE
                  );
            END;
            $$;
        ");
    }
};
