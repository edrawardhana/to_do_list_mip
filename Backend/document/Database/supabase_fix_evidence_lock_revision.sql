-- =============================================================================
-- PATCH: Fix Evidence Lock — izinkan re-upload saat status 'revision'
-- Jalankan di Supabase SQL Editor
-- =============================================================================

CREATE OR REPLACE FUNCTION fn_lock_evidence_url()
RETURNS TRIGGER AS $$
DECLARE
    v_role text;
BEGIN
    -- Hanya blokir jika evidence_url sudah ada DAN nilainya berubah
    IF OLD.evidence_url IS NOT NULL AND NEW.evidence_url IS DISTINCT FROM OLD.evidence_url THEN

        -- Pengecualian: task dengan status 'revision' BOLEH ganti foto
        -- Admin yang set status revision berarti meminta intern upload ulang
        IF OLD.status = 'revision' OR NEW.status = 'revision' THEN
            RETURN NEW;
        END IF;

        -- Cek role yang sedang melakukan update
        SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();

        -- Intern biasa tidak boleh ganti foto yang sudah terkunci
        IF v_role = 'intern' THEN
            RAISE EXCEPTION '[LOCK] evidence_url sudah terkunci dan tidak dapat diubah. (task_id: %)', OLD.id;
        END IF;

    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-attach trigger (tidak perlu drop, CREATE OR REPLACE sudah update fungsinya)
DROP TRIGGER IF EXISTS trigger_lock_evidence ON public.daily_tasks;
CREATE TRIGGER trigger_lock_evidence
    BEFORE UPDATE ON public.daily_tasks
    FOR EACH ROW EXECUTE FUNCTION fn_lock_evidence_url();
