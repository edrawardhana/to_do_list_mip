-- =============================================================================
-- FIX: Ubah confirmed_participants dari json → jsonb
-- Jalankan di Supabase SQL Editor
-- =============================================================================

-- 1. Drop default dulu (wajib sebelum ALTER TYPE)
ALTER TABLE public.daily_tasks
    ALTER COLUMN confirmed_participants DROP DEFAULT;

-- 2. Ubah tipe kolom ke jsonb
ALTER TABLE public.daily_tasks
    ALTER COLUMN confirmed_participants
    TYPE jsonb
    USING COALESCE(confirmed_participants::text::jsonb, '[]'::jsonb);

-- 3. Set default baru sebagai jsonb
ALTER TABLE public.daily_tasks
    ALTER COLUMN confirmed_participants
    SET DEFAULT '[]'::jsonb;

-- 4. Verifikasi
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'daily_tasks'
  AND column_name = 'confirmed_participants';
-- Expected: data_type = 'jsonb', column_default = '[]'::jsonb
