-- ==============================================================================
-- SETUP SUPABASE DATABASE TRIGGER: AUTO-LOCK SAAT IZIN/SAKIT (ERD v3 - EXCEPTIONS)
-- Tujuan: Jika ada pengajuan exception (Sakit/Izin) disetujui untuk HARI INI,
--         maka akun intern otomatis digembok.
--         Sebaliknya, jika diubah menjadi 'swap_shift' atau 'tugas_luar', otomatis dibuka (jika sblmnya dikunci).
-- ==============================================================================

-- 1. BUAT FUNGSI (PROCEDURE) PEMICUNYA
CREATE OR REPLACE FUNCTION lock_user_on_leave_or_sick()
RETURNS TRIGGER AS $$
BEGIN
    -- KONDISI 1: Hanya eksekusi logika ngunci jika absensinya DISETUJUI ADMIN dan HARI INI = permission_date
    IF NEW.status = 'approved' AND CURRENT_DATE = NEW.permission_date THEN
        IF NEW.type = 'izin' OR NEW.type = 'sakit' THEN
            UPDATE public.profiles SET is_locked = true WHERE id = NEW.user_id AND role = 'intern'; 
        ELSIF NEW.type = 'swap_shift' OR NEW.type = 'tugas_luar' THEN
            UPDATE public.profiles SET is_locked = false WHERE id = NEW.user_id AND role = 'intern';
        END IF;
    END IF;

    -- KONDISI 2: Jika admin membatalkan (rejected/pending) izin yang sedang berjalan hari ini, gemboknya dicabut balik.
    IF NEW.status != 'approved' AND OLD.status = 'approved' AND CURRENT_DATE = NEW.permission_date THEN
         UPDATE public.profiles SET is_locked = false WHERE id = NEW.user_id AND role = 'intern';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. PASANG TRIGGER KE TABEL exceptions
DROP TRIGGER IF EXISTS trigger_lock_on_exception ON public.exceptions;

CREATE TRIGGER trigger_lock_on_exception
AFTER INSERT OR UPDATE ON public.exceptions
FOR EACH ROW
EXECUTE FUNCTION lock_user_on_leave_or_sick();

-- ==============================================================================
-- CARA KERJA TRIGGER:
-- Trigger ini akan aktif setiap kali ada exception disetujui.
-- ==============================================================================
