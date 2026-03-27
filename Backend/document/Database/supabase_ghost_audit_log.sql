-- ==============================================================================
-- SETUP SUPABASE GHOST AUDIT LOG: LOG PERMANEN ANTI-HAPUS
-- Tujuan: Membuat tabel audit_logs menjadi "IMMUTABLE" (Tidak bisa dihapus/diubah).
--         Semua catatan aksi Admin (Terima/Tolak/Edit) yang masuk ke tabel ini
--         akan tersegel permanen di level Database dan tidak bisa dihapus oleh
--         siapapun, termasuk Superadmin, melalui jalur aplikasi.
-- ==============================================================================

-- 1. TRIGGER: BLOKIR DELETE PADA TABEL AUDIT_LOGS
-- Mencegah siapapun menghapus data log melalui SQL DELETE statement.
CREATE OR REPLACE FUNCTION prevent_audit_log_delete()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'GHOST LOCK: Catatan Audit Log bersifat permanen dan tidak dapat dihapus dari sistem.';
    RETURN NULL; -- Tidak akan pernah tercapai, tapi wajib ada untuk syntax
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_ghost_audit_no_delete ON public.audit_logs;

CREATE TRIGGER trigger_ghost_audit_no_delete
BEFORE DELETE ON public.audit_logs
FOR EACH ROW
EXECUTE FUNCTION prevent_audit_log_delete();


-- 2. TRIGGER: BLOKIR UPDATE PADA TABEL AUDIT_LOGS
-- Mencegah siapapun mengubah isi log yang sudah tercatat.
CREATE OR REPLACE FUNCTION prevent_audit_log_update()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'GHOST LOCK: Catatan Audit Log tidak dapat dimodifikasi setelah tercatat.';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_ghost_audit_no_update ON public.audit_logs;

CREATE TRIGGER trigger_ghost_audit_no_update
BEFORE UPDATE ON public.audit_logs
FOR EACH ROW
EXECUTE FUNCTION prevent_audit_log_update();


-- 3. RLS: HANYA BOLEH INSERT DAN SELECT (Proteksi Tambahan)
-- Pastikan RLS aktif di tabel audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Hapus policy lama jika ada
DROP POLICY IF EXISTS "Allow insert audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Allow read audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Deny delete audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Deny update audit logs" ON public.audit_logs;

-- Izinkan INSERT oleh semua authenticated users (sistem mencatat otomatis)
CREATE POLICY "Allow insert audit logs"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Izinkan SELECT oleh authenticated users (Controller akan filter per divisi)
CREATE POLICY "Allow read audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (true);

-- TIDAK ada policy untuk DELETE dan UPDATE = otomatis DITOLAK oleh RLS
