-- =============================================================================
-- HOUSEKEEPING — Auto cleanup data > 90 hari
-- Jalankan file ini di Supabase SQL Editor
-- =============================================================================

-- ── Fungsi cleanup utama ──────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION fn_housekeeping_cleanup()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_cutoff        timestamptz := now() - interval '90 days';
    v_tasks_deleted int         := 0;
    v_audit_deleted int         := 0;
    v_month         text        := to_char(now(), 'FMMonth YYYY');
    v_dev_id        uuid;
BEGIN
    -- 1. Hapus daily_tasks lama
    DELETE FROM public.daily_tasks WHERE created_at < v_cutoff;
    GET DIAGNOSTICS v_tasks_deleted = ROW_COUNT;

    -- 2. Hapus audit_logs lama (bypass ghost lock trigger)
    SET LOCAL session_replication_role = replica;
    DELETE FROM public.audit_logs WHERE created_at < v_cutoff;
    GET DIAGNOSTICS v_audit_deleted = ROW_COUNT;
    SET LOCAL session_replication_role = DEFAULT;

    -- 3. Cari developer untuk admin_id di audit log
    SELECT id INTO v_dev_id
    FROM public.profiles
    WHERE role = 'developer'
    LIMIT 1;

    -- 4. Catat hasil ke audit_logs (hanya jika ada developer)
    IF v_dev_id IS NOT NULL THEN
        INSERT INTO public.audit_logs
            (admin_id, actor_role, action, new_values, created_at)
        VALUES (
            v_dev_id,
            'system',
            'Housekeeping Otomatis ' || v_month,
            jsonb_build_object(
                'cutoff_date',   v_cutoff::date,
                'tasks_deleted', v_tasks_deleted,
                'audit_deleted', v_audit_deleted,
                'executed_at',   now()
            ),
            now()
        );
    END IF;

    RETURN jsonb_build_object(
        'month',          v_month,
        'cutoff_date',    v_cutoff::date,
        'tasks_deleted',  v_tasks_deleted,
        'audit_deleted',  v_audit_deleted
    );
END;
$$;

-- ── Cron job: tanggal 1 setiap bulan, 02:00 WIB = 19:00 UTC ──────────────────
DO $$
BEGIN
    PERFORM cron.unschedule('housekeeping-monthly');
EXCEPTION
    WHEN OTHERS THEN NULL;
END;
$$;

SELECT cron.schedule(
    'housekeeping-monthly',
    '0 19 1 * *',
    'SELECT fn_housekeeping_cleanup()'
);

-- ── Verifikasi ────────────────────────────────────────────────────────────────
SELECT jobname, schedule, command
FROM cron.job
WHERE jobname = 'housekeeping-monthly';

-- ── Test manual (uncomment untuk jalankan sekarang) ───────────────────────────
-- SELECT fn_housekeeping_cleanup();

-- ── Data dummy untuk testing (created_at 4 bulan lalu) ───────────────────────
-- Uncomment, jalankan, lalu test Force Clean Up dari UI Developer.
-- Hapus komentar ini setelah selesai testing.
--
-- INSERT INTO public.daily_tasks
--     (uploader_id, division_id, template_id, status, task_date, created_at, updated_at)
-- SELECT
--     p.id,
--     p.division_id,
--     t.id,
--     'approved',
--     (now() - interval '4 months')::date,
--     now() - interval '4 months',
--     now() - interval '4 months'
-- FROM public.profiles p
-- JOIN public.task_templates t ON p.division_id = t.division_id
-- WHERE p.role = 'intern'
--   AND p.is_verified = true
-- LIMIT 10;
--
-- -- Cek data dummy:
-- SELECT id, task_date, created_at
-- FROM public.daily_tasks
-- WHERE created_at < now() - interval '90 days'
-- ORDER BY created_at ASC;
