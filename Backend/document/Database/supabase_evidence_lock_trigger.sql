-- ==============================================================================
-- SETUP SUPABASE DATABASE TRIGGER: KUNCI BUKTI FOTO PERTAMA (EVIDENCE LOCK)
-- Tujuan: Memastikan karyawan hanya bisa MENGUNGGAH foto bukti SATU KALI.
--         Setelah kolom `evidence_url` terisi, data tersebut langsung terkunci (Read-Only)
--         untuk karyawan. Hanya Admin/Superadmin yang bisa merevisinya.
-- ==============================================================================

-- 1. BUAT FUNGSI (PROCEDURE) PEMICUNYA MENCEGAH UPDATE
CREATE OR REPLACE FUNCTION prevent_evidence_update()
RETURNS TRIGGER AS $$
DECLARE
    user_role text;
BEGIN
    -- KONDISI UTAMA: 
    -- Jika kolom evidence_url LAMA itu TIDAK KOSONG (berarti sudah pernah upload)
    -- DAN nilai evidence_url BARU mencoba MENGUBAH URL yang lama tersebut
    IF OLD.evidence_url IS NOT NULL AND NEW.evidence_url IS DISTINCT FROM OLD.evidence_url THEN
        
        -- Cari tahu apa jabatan orang yang sedang mencoba melakukan Update ini
        SELECT role INTO user_role FROM public.profiles WHERE id = auth.uid();
        
        -- Jika dia ternyata cuma 'intern' biasa, BATALKAN proses update dan lemparkan pesan Error
        IF user_role = 'intern' THEN
            RAISE EXCEPTION 'Akses Ditolak: Bukti foto untuk tugas pelaporan ini sudah dikunci permanen oleh sistem. Silakan hubungi Admin divisi Anda jika terjadi kesalahan unggah.';
        END IF;
        
    END IF;

    -- Jika yang mengubah adalah Admin/Superadmin, atau ini adalah upload foto pertama kalinya,
    -- izinkan proses penyimpanan (Update) diteruskan dengan mengembalikan baris NEW.
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. PASANG TRIGGER KE TABEL daily_tasks
DROP TRIGGER IF EXISTS trigger_lock_evidence ON public.daily_tasks;

-- Memicu (menjalankan) fungsi penahan di atas SEBELUM (BEFORE) 
-- perubahan (UPDATE) benar-benar disimpan ke dalam tabel 'daily_tasks'
CREATE TRIGGER trigger_lock_evidence
BEFORE UPDATE ON public.daily_tasks
FOR EACH ROW
EXECUTE FUNCTION prevent_evidence_update();

-- ==============================================================================
-- CARA KERJA SISTEM:
-- Sistem ini berjalan di lapisan paling bawah (Database). 
-- Jika hacker mengelabui frontend, atau programmer frontend lupa memberi atribut "disabled" 
-- pada tombol Upload setelah mereka mengupload, ketika API dikirim ke Backend dan 
-- Backend mencoba me-konek ke Supabase: 
-- Supabase akan dengan tegas memberikan balasan ERROR HTTP 500/400 berisi pesan:
-- "Akses Ditolak: Bukti foto untuk tugas..."
-- ==============================================================================
