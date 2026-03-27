-- PANDUAN SETUP CRON JOB: GENERATE DAILY TASKS OTOMATIS (ERD v3 Version)
-- Waktu Server: Zona Waktu WIB (Malang Kota, UTC+7) - Jalan Jam 00:00 WIB (17:00 UTC)
-- Tujuan: Menarik template tugas per divisi dan membagikannya ke semua intern terkait setiap hari.
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
-- Logika: Mengambil semua intern per-divisi, 
-- lalu mencocokkan dengan task_templates milik divisinya yang aktif,
-- kemudian dijejalkan ke tabel daily_tasks untuk hari ini.
CREATE OR REPLACE FUNCTION generate_daily_tasks_from_templates()
RETURNS void AS $$
BEGIN
    INSERT INTO public.daily_tasks (
        uploader_id, 
        division_id, 
        template_id, 
        status,
        task_date
    )
    SELECT 
        p.id AS uploader_id,
        p.division_id,
        t.id AS template_id,
        'pending' AS status,
        CURRENT_DATE AS task_date
    FROM 
        public.profiles p
    JOIN 
        public.task_templates t ON p.division_id = t.division_id
    WHERE 
        p.role = 'intern' 
        AND p.division_id IS NOT NULL
        AND t.is_active = true
        AND NOT EXISTS (
            SELECT 1 FROM exceptions e
            WHERE e.user_id = p.id
              AND e.status = 'approved'
              AND (e.type = 'izin' OR e.type = 'sakit' OR e.type = 'tugas_luar')
              AND e.permission_date = CURRENT_DATE
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
