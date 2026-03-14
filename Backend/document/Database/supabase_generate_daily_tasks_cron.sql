-- PANDUAN SETUP CRON JOB: GENERATE DAILY TASKS OTOMATIS
-- Waktu Server: Zona Waktu WIB (Malang Kota, UTC+7) - Jalan Jam 00:00 WIB (17:00 UTC)
-- Tujuan: Menarik template tugas per divisi dan membagikannya ke semua karyawan terkait setiap hari.
-- ----------------------------------------------------

-- 1. Pastikan Ekstensi pg_cron Aktif
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Hapus Job Lama (Mencegah duplikasi jadwal saat script di-run ulang)
DO $$
BEGIN
    PERFORM cron.unschedule('generate-daily-tasks');
EXCEPTION
    WHEN OTHERS THEN
        -- Abaikan jika job belum ada
END $$;


-- 3. Buat Fungsi (Procedure) untuk Meng-generate Tugas
-- Logika: Mengambil semua user (karyawan biasa) per-divisi, 
-- lalu mencocokkan dengan task_templates milik divisinya,
-- kemudian dijejalkan ke tabel daily_tasks untuk hari ini.
CREATE OR REPLACE FUNCTION generate_daily_tasks_from_templates()
RETURNS void AS $$
BEGIN
    INSERT INTO public.daily_tasks (
        user_id, 
        division_id, 
        task_template_id, 
        task_name, 
        status
    )
    SELECT 
        p.id AS user_id,
        p.division_id,
        t.id AS task_template_id,
        t.task_name,
        'pending' AS status
    FROM 
        public.profiles p
    JOIN 
        public.task_templates t ON p.division_id = t.division_id
    WHERE 
        p.role = 'user' 
        AND p.division_id IS NOT NULL
        AND NOT EXISTS (
            SELECT 1 FROM attendance_schedules a
            WHERE a.user_id = p.id
              AND a.is_approved = true
              AND (a.type = 'Izin' OR a.type = 'Sakit' OR a.type = 'Libur')
              AND CURRENT_DATE BETWEEN a.start_date AND a.end_date
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. Jadwalkan Fungsi Tersebut dengan pg_cron
-- Karena Server Supabase menggunakan UTC (GTM+0)
-- Malang Kota (WIB) adalah UTC+7. 
-- Agar cron jalan jam 00:00 WIB, kita kurangi 7 jam = 17:00 UTC (Setiap jam 5 sore teng waktu dunia).
SELECT cron.schedule(
    'generate-daily-tasks',
    '0 17 * * *',
    'SELECT generate_daily_tasks_from_templates()'
);
