# 🔧 Migration Steps: Fix Image URLs

**Quick Guide untuk migrate relative URLs ke full URLs**

---

## Langkah-Langkah

### 1. Buka Supabase SQL Editor

1. Login ke [Supabase Dashboard](https://supabase.com/dashboard)
2. Pilih project Anda
3. Klik **SQL Editor** di sidebar kiri
4. Klik **New Query**

---

### 2. Copy & Paste Script Ini

```sql
-- STEP 1: Start transaction & bypass triggers
BEGIN;
SET session_replication_role = replica;

-- STEP 2: Update URLs (pilih salah satu)

-- Untuk Development (localhost):
UPDATE daily_tasks
SET evidence_url = 'http://localhost:8000' || evidence_url
WHERE evidence_url IS NOT NULL
  AND evidence_url NOT LIKE 'http%'
  AND evidence_url LIKE '/storage/%';

-- Untuk Production (uncomment jika production):
-- UPDATE daily_tasks
-- SET evidence_url = 'https://api.yourdomain.com' || evidence_url
-- WHERE evidence_url IS NOT NULL
--   AND evidence_url NOT LIKE 'http%'
--   AND evidence_url LIKE '/storage/%';

-- STEP 3: Reset & commit
SET session_replication_role = DEFAULT;
COMMIT;

-- STEP 4: Verify hasil
SELECT id, evidence_url, status
FROM daily_tasks
WHERE evidence_url IS NOT NULL
ORDER BY updated_at DESC
LIMIT 5;
```

---

### 3. Klik "Run" atau tekan Ctrl+Enter

Expected output:
```
BEGIN
SET
UPDATE 1  (atau jumlah rows yang diupdate)
SET
COMMIT
```

---

### 4. Verify Hasil

Dari query terakhir, Anda akan melihat:

**Before**:
```
/storage/task_evidence/task_xxx.jpg
```

**After**:
```
http://localhost:8000/storage/task_evidence/task_xxx.jpg
```

---

### 5. Test di Browser

1. Copy salah satu URL dari hasil query
2. Paste di browser
3. ✅ Harus bisa membuka gambar

---

### 6. Test Upload Baru

1. Login ke aplikasi sebagai intern
2. Upload foto baru di task
3. ✅ URL harus otomatis full URL

---

## Penjelasan

### `session_replication_role = replica`

Setting ini membuat PostgreSQL **bypass semua custom triggers** (termasuk trigger lock), tapi tetap menjaga:
- ✅ Foreign key constraints
- ✅ Check constraints
- ✅ System triggers

**Aman untuk migration** karena:
- Hanya berlaku dalam transaction (BEGIN...COMMIT)
- Otomatis reset setelah COMMIT
- Tidak permanent

---

## Troubleshooting

### Error: "permission denied"

**Solution**: Pastikan Anda login sebagai owner/admin di Supabase.

---

### Update Tidak Jalan

**Check**: Apakah ada data dengan relative URL?

```sql
SELECT COUNT(*) 
FROM daily_tasks
WHERE evidence_url IS NOT NULL
  AND evidence_url NOT LIKE 'http%';
```

Jika 0, berarti semua sudah full URL.

---

### Rollback Jika Salah

```sql
BEGIN;
SET session_replication_role = replica;

UPDATE daily_tasks
SET evidence_url = REPLACE(evidence_url, 'http://localhost:8000', '')
WHERE evidence_url LIKE 'http://localhost:8000%';

SET session_replication_role = DEFAULT;
COMMIT;
```

---

## Important Notes

✅ `session_replication_role = replica` bypass custom triggers

✅ Transaction (BEGIN/COMMIT) memastikan atomic operation

✅ Migration ini **hanya dilakukan sekali** untuk fix data yang sudah ada

✅ Upload baru akan **otomatis** menggunakan full URL dari backend code

✅ Trigger lock tetap aktif setelah migration (tidak perlu enable manual)

---

## Summary

| Step | Command | Purpose |
|------|---------|---------|
| 1 | `BEGIN` | Start transaction |
| 2 | `SET session_replication_role = replica` | Bypass triggers |
| 3 | `UPDATE daily_tasks SET...` | Update URLs |
| 4 | `SET session_replication_role = DEFAULT` | Reset setting |
| 5 | `COMMIT` | Save changes |
| 6 | `SELECT...` | Verify hasil |

---

**Done!** 🎉 Gambar sekarang akan tampil dengan benar di frontend.
