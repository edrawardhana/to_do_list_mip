-- ==============================================================================
-- SETUP SUPABASE DATABASE TRIGGER: AUTO-LOCK SAAT IZIN/SAKIT
-- Tujuan: Jika ada pengajuan atau update pengajuan absen menjadi 'Izin' atau 'Sakit',
--         maka akun user otomatis digembok.
--         Sebaliknya, jika diubah menjadi 'Swap' atau 'Libur', otomatis dibuka (jika sblmnya dikunci).
-- ==============================================================================

-- 1. BUAT FUNGSI (PROCEDURE) PEMICUNYA
CREATE OR REPLACE FUNCTION lock_user_on_leave_or_sick()
RETURNS TRIGGER AS $$
BEGIN
    -- KONDISI 1: Hanya eksekusi logika ngunci jika absensinya DISETUJUI ADMIN dan HARI INI masuk dalam rentang cuti
    IF NEW.is_approved = true AND CURRENT_DATE BETWEEN NEW.start_date AND NEW.end_date THEN
        IF NEW.type = 'Izin' OR NEW.type = 'Sakit' THEN
            UPDATE public.profiles SET is_locked = true WHERE id = NEW.user_id AND role = 'user'; 
        ELSIF NEW.type = 'Swap' OR NEW.type = 'Libur' THEN
            UPDATE public.profiles SET is_locked = false WHERE id = NEW.user_id AND role = 'user';
        END IF;
    END IF;

    -- KONDISI 2: Jika admin membatalkan/mencabut izin yang sedang berjalan hari ini, gemboknya dicabut balik.
    IF NEW.is_approved = false AND OLD.is_approved = true AND CURRENT_DATE BETWEEN NEW.start_date AND NEW.end_date THEN
         UPDATE public.profiles SET is_locked = false WHERE id = NEW.user_id AND role = 'user';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. PASANG TRIGGER KE TABEL attendance_schedules
DROP TRIGGER IF EXISTS trigger_lock_on_leave_sick ON public.attendance_schedules;

CREATE TRIGGER trigger_lock_on_leave_sick
AFTER INSERT OR UPDATE ON public.attendance_schedules
FOR EACH ROW
EXECUTE FUNCTION lock_user_on_leave_or_sick();

-- ==============================================================================
-- CARA KERJA TRIGGER:
-- Trigger ini akan aktif setiap kali ada pengajuan izin masuk atau diupdate.
-- Backend Laravel akan memasukkan data type='Izin' atau 'Sakit' beserta surat sakit di proof_url.
-- ==============================================================================
