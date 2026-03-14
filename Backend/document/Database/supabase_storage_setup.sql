-- ==============================================================================
-- SETUP SUPABASE STORAGE BUCKET: "task_evidence"
-- Tujuan: Membuat wadah penyimpanan file bukti
-- ==============================================================================

-- 1. MEMBUAT BUCKET BARU
INSERT INTO storage.buckets (id, name, public)
VALUES ('task_evidence', 'task_evidence', true)
ON CONFLICT (id) DO NOTHING;

-- Menghapus Policy yang mungkin sudah ada sebelumnya 
DROP POLICY IF EXISTS "Public View Evidence" ON storage.objects;
DROP POLICY IF EXISTS "User Upload Evidence" ON storage.objects;
DROP POLICY IF EXISTS "Owner or Superadmin Delete Evidence" ON storage.objects;

-- 2. KONFIGURASI KEAMANAN (RLS) UNTUK BUCKET "task_evidence"
-- (Perintah ALTER TABLE ditiadakan agar tidak error permission)

-- A) POLICY READ (SELECT) -> Siapa yang boleh melihat/mendownload fotonya?
CREATE POLICY "Public View Evidence"
ON storage.objects FOR SELECT
USING ( bucket_id = 'task_evidence' );

-- B) POLICY CREATE (INSERT) -> Siapa yang boleh mengupload foto?
CREATE POLICY "User Upload Evidence"
ON storage.objects FOR INSERT
WITH CHECK ( 
    bucket_id = 'task_evidence' AND 
    auth.role() = 'authenticated'
);

-- C) POLICY DELETE -> Siapa yang boleh menghapus foto dari server?
CREATE POLICY "Owner or Superadmin Delete Evidence"
ON storage.objects FOR DELETE
USING ( 
    bucket_id = 'task_evidence' AND 
    (
        auth.uid() = owner -- User yang mengupload file tersebut
        OR 
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'superadmin' 
    )
);
