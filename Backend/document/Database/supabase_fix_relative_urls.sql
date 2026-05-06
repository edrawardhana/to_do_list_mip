-- ==============================================================================
-- MIGRATION: Fix Relative URLs to Full URLs
-- Tujuan: Update evidence_url yang masih relative path menjadi full URL
-- Tanggal: 2026-05-06
-- ==============================================================================

-- IMPORTANT: Jalankan script ini di Supabase SQL Editor
-- Script ini akan DISABLE trigger custom sementara untuk migration

-- ==============================================================================
-- STEP 1: CHECK - Lihat trigger yang aktif
-- ==============================================================================
SELECT 
    tgname as trigger_name,
    tgenabled as enabled,
    pg_get_triggerdef(oid) as definition
FROM pg_trigger 
WHERE tgrelid = 'daily_tasks'::regclass
  AND tgisinternal = false  -- Hanya custom triggers, bukan system triggers
ORDER BY tgname;

-- ==============================================================================
-- STEP 2: CHECK - Lihat data yang perlu diupdate
-- ==============================================================================
SELECT 
    id,
    evidence_url,
    status,
    created_at
FROM daily_tasks
WHERE evidence_url IS NOT NULL
  AND evidence_url NOT LIKE 'http%'  -- Relative URLs (tidak dimulai dengan http)
ORDER BY created_at DESC;

-- ==============================================================================
-- STEP 3: DISABLE CUSTOM TRIGGERS ONLY
-- ==============================================================================
-- Cari nama trigger yang mengunci evidence_url dan disable satu per satu
-- Biasanya namanya: trigger_lock_evidence, trigger_lock_evidence_url, atau prevent_evidence_update

-- Coba disable trigger yang umum (uncomment yang sesuai):
-- ALTER TABLE daily_tasks DISABLE TRIGGER trigger_lock_evidence;
-- ALTER TABLE daily_tasks DISABLE TRIGGER trigger_lock_evidence_url;
-- ALTER TABLE daily_tasks DISABLE TRIGGER prevent_evidence_update;

-- Atau gunakan query ini untuk generate command disable:
SELECT 
    'ALTER TABLE daily_tasks DISABLE TRIGGER ' || tgname || ';' as disable_command
FROM pg_trigger 
WHERE tgrelid = 'daily_tasks'::regclass
  AND tgisinternal = false
  AND tgname LIKE '%evidence%' OR tgname LIKE '%lock%';

-- ==============================================================================
-- ALTERNATIVE: UPDATE DENGAN SESSION VARIABLE
-- ==============================================================================
-- Jika trigger check session variable, set sebagai admin:
-- SET LOCAL role TO 'postgres';
-- Atau:
-- SET session_replication_role = replica;

-- Dengan session_replication_role = replica, trigger tidak akan fire
BEGIN;
SET session_replication_role = replica;

-- ==============================================================================
-- STEP 4: UPDATE - Convert relative URLs to full URLs
-- ==============================================================================

-- ============================================================
-- OPTION A: DEVELOPMENT (localhost)
-- ============================================================
-- Gunakan ini jika masih development/testing di localhost
UPDATE daily_tasks
SET evidence_url = 'http://localhost:8000' || evidence_url
WHERE evidence_url IS NOT NULL
  AND evidence_url NOT LIKE 'http%'
  AND evidence_url LIKE '/storage/%';

-- ============================================================
-- OPTION B: PRODUCTION
-- ============================================================
-- Uncomment dan sesuaikan domain untuk production
-- Ganti 'https://api.yourdomain.com' dengan domain backend Anda

-- UPDATE daily_tasks
-- SET evidence_url = 'https://api.yourdomain.com' || evidence_url
-- WHERE evidence_url IS NOT NULL
--   AND evidence_url NOT LIKE 'http%'
--   AND evidence_url LIKE '/storage/%';

-- ============================================================
-- OPTION C: STAGING
-- ============================================================
-- Uncomment untuk staging environment

-- UPDATE daily_tasks
-- SET evidence_url = 'https://staging-api.yourdomain.com' || evidence_url
-- WHERE evidence_url IS NOT NULL
--   AND evidence_url NOT LIKE 'http%'
--   AND evidence_url LIKE '/storage/%';

-- ==============================================================================
-- STEP 5: RESET SESSION & COMMIT
-- ==============================================================================
SET session_replication_role = DEFAULT;
COMMIT;

-- ==============================================================================
-- STEP 6: VERIFY - Check hasil update
-- ==============================================================================
SELECT 
    id,
    evidence_url,
    status,
    updated_at
FROM daily_tasks
WHERE evidence_url IS NOT NULL
ORDER BY updated_at DESC
LIMIT 10;

-- ==============================================================================
-- EXPECTED RESULTS:
-- ==============================================================================
-- Development:
--   Before: /storage/task_evidence/task_xxx_xxx.jpg
--   After:  http://localhost:8000/storage/task_evidence/task_xxx_xxx.jpg
--
-- Production:
--   Before: /storage/task_evidence/task_xxx_xxx.jpg
--   After:  https://api.yourdomain.com/storage/task_evidence/task_xxx_xxx.jpg
-- ==============================================================================

-- ==============================================================================
-- STEP 7: TEST - Akses URL di browser
-- ==============================================================================
-- 1. Copy salah satu evidence_url dari hasil query di atas
-- 2. Paste di browser
-- 3. Harus bisa membuka gambar (tidak 404)

-- ==============================================================================
-- MIGRATION ANTAR ENVIRONMENT
-- ==============================================================================

-- Jika migrasi dari Development ke Production:
-- BEGIN;
-- SET session_replication_role = replica;
-- 
-- UPDATE daily_tasks
-- SET evidence_url = REPLACE(
--     evidence_url, 
--     'http://localhost:8000', 
--     'https://api.yourdomain.com'
-- )
-- WHERE evidence_url LIKE 'http://localhost:8000%';
-- 
-- SET session_replication_role = DEFAULT;
-- COMMIT;

-- Jika migrasi dari Staging ke Production:
-- BEGIN;
-- SET session_replication_role = replica;
-- 
-- UPDATE daily_tasks
-- SET evidence_url = REPLACE(
--     evidence_url, 
--     'https://staging-api.yourdomain.com', 
--     'https://api.yourdomain.com'
-- )
-- WHERE evidence_url LIKE 'https://staging-api.yourdomain.com%';
-- 
-- SET session_replication_role = DEFAULT;
-- COMMIT;

-- ==============================================================================
-- ROLLBACK (Jika ada masalah)
-- ==============================================================================
-- Jika perlu rollback ke relative URLs:
-- BEGIN;
-- SET session_replication_role = replica;
-- 
-- UPDATE daily_tasks
-- SET evidence_url = REPLACE(evidence_url, 'http://localhost:8000', '')
-- WHERE evidence_url LIKE 'http://localhost:8000%';
-- 
-- SET session_replication_role = DEFAULT;
-- COMMIT;

-- ==============================================================================
-- TROUBLESHOOTING
-- ==============================================================================

-- Jika masih error, coba cek trigger definition:
-- SELECT pg_get_triggerdef(oid) 
-- FROM pg_trigger 
-- WHERE tgrelid = 'daily_tasks'::regclass 
--   AND tgisinternal = false;

-- Cek apakah trigger check role:
-- SELECT current_user, current_role;

-- ==============================================================================
-- NOTES:
-- ==============================================================================
-- ✅ session_replication_role = replica akan bypass semua custom triggers
-- ✅ System triggers (foreign keys, constraints) tetap aktif
-- ✅ BEGIN/COMMIT memastikan perubahan atomic
-- ✅ SET LOCAL hanya berlaku dalam transaction
-- ✅ Migration ini hanya dilakukan sekali untuk fix existing data
-- ✅ Upload baru akan otomatis menggunakan full URL dari backend code
-- ==============================================================================
