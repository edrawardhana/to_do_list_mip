-- ==============================================================================
-- ADD COLUMN: confirmed_participants (JSONB)
-- Menyimpan array berupa daftar User ID yang berpartisipasi atau terkonfirmasi dalam tugas.
-- ==============================================================================

-- Menambahkan kolom 'confirmed_participants' ke tabel daily_tasks
-- Menggunakan tipe data JSONB (JSON Binary) karena sangat efisien dan mudah di-query di PostgreSQL.
-- Defaultnya dibiarkan kosong (NULL) jika belum ada.
ALTER TABLE public.daily_tasks 
ADD COLUMN IF NOT EXISTS confirmed_participants JSONB DEFAULT '[]'::jsonb;

-- Opsional: Jika butuh index untuk mempercepat pencarian (Misal mencari tugas dimana si Budi ikut serta)
-- CREATE INDEX idx_daily_tasks_participants ON public.daily_tasks USING GIN (confirmed_participants);
