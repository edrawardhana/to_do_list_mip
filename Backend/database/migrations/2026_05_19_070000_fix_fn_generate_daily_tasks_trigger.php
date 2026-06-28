<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Update the fn_generate_daily_tasks trigger function to copy start_time, end_time, and reminder_time
        if (DB::getDriverName() !== 'sqlite') {
            DB::unprepared("
                CREATE OR REPLACE FUNCTION fn_generate_daily_tasks()
                RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
                DECLARE
                    t_record RECORD;
                BEGIN
                    FOR t_record IN
                        SELECT id, title, start_time, end_time, reminder_time
                        FROM public.task_templates
                        WHERE division_id = NEW.division_id
                          AND is_active = true
                    LOOP
                        INSERT INTO public.daily_tasks (
                            uploader_id,
                            division_id,
                            template_id,
                            task_date,
                            description,
                            status,
                            start_time,
                            end_time,
                            reminder_time
                        ) VALUES (
                            NEW.user_id,
                            NEW.division_id,
                            t_record.id,
                            NEW.permission_date,
                            'Generated automatically based on active templates',
                            'pending',
                            t_record.start_time,
                            t_record.end_time,
                            t_record.reminder_time
                        );
                    END LOOP;

                    RETURN NEW;
                END;
                $$;
            ");
        }
    }

    public function down(): void
    {
        // Revert to original generate logic without explicit time columns
        if (DB::getDriverName() !== 'sqlite') {
            DB::unprepared("
                CREATE OR REPLACE FUNCTION fn_generate_daily_tasks()
                RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
                BEGIN
                    INSERT INTO public.daily_tasks (uploader_id, division_id, template_id, status, task_date)
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
    }
};
