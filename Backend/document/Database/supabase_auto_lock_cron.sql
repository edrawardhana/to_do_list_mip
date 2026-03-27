-- PANDUAN SETUP CRON JOB AUTO-LOCK & AUTO-UNLOCK DI SUPABASE
-- Waktu Server: Zona Waktu WIB (Malang Kota, UTC+7)
-- ----------------------------------------------------
-- Copy-paste seluruh kodingan ini ke menu "SQL Editor" di Dashboard Supabase 
-- lalu klik tombol "RUN".
-- ----------------------------------------------------

-- 1. Pastikan Ekstensi pg_cron Aktif
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Hapus Job Lama (Dengan aman, tangkap error jika job belum ada)
DO $$
BEGIN
    PERFORM cron.unschedule('auto-lock-daily');
EXCEPTION
    WHEN OTHERS THEN
        -- Abaikan saja error ini, artinya job belum pernah dibuat
END $$;

DO $$
BEGIN
    PERFORM cron.unschedule('auto-unlock-daily');
EXCEPTION
    WHEN OTHERS THEN
        -- Abaikan saja
END $$;

-- 3. Buat Fungsi untuk Mengunci Akun (JAM TUTUP)
--    (Hanya mengunci user biasa. Admin dan Superadmin AMAN)
CREATE OR REPLACE FUNCTION lock_regular_users()
RETURNS void AS $$
BEGIN
    UPDATE profiles
    SET is_locked = true
    WHERE role = 'intern'; -- HANYA 'intern' yang dikunci
END;
$$ LANGUAGE plpgsql;

-- 4. Buat Fungsi untuk Membuka Akun (JAM BUKA)
CREATE OR REPLACE FUNCTION unlock_regular_users()
RETURNS void AS $$
BEGIN
    UPDATE profiles p
    SET is_locked = false
    WHERE p.role = 'intern'
    AND NOT EXISTS (
        SELECT 1 FROM exceptions e
        WHERE e.user_id = p.id
          AND e.status = 'approved'
          AND (e.type = 'izin' OR e.type = 'sakit')
          AND e.permission_date = CURRENT_DATE
    );
END;
$$ LANGUAGE plpgsql;

-- 5. Jadwalkan Fungsi Tersebut dengan pg_cron (Zona Waktu Supabase adalah UTC)
--    Malang Kota (WIB) adalah UTC+7, jadi jam WIB harus dikurangi 7 jam.

-- A) AUTO-LOCK (TUTUP: 21:30 WIB) --> 21:30 - 7 jam = 14:30 UTC
SELECT cron.schedule(
    'auto-lock-daily',
    '30 14 * * *',
    'SELECT lock_regular_users()'
);

-- B) AUTO-UNLOCK (BUKA: 07:30 WIB) --> 07:30 - 7 jam = 00:30 UTC
SELECT cron.schedule(
    'auto-unlock-daily',
    '30 0 * * *',
    'SELECT unlock_regular_users()'
);

-- ====================================================
-- PANDUAN WAKTU YANG SUDAH DISET DI ATAS (UTC vs WIB):
-- TUTUP (Lock):   21:30 WIB = 14:30 UTC -> '30 14 * * *'
-- BUKA (Unlock):  07:30 WIB = 00:30 UTC -> '30 0 * * *'
-- ====================================================
