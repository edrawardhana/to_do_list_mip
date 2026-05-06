# ✅ QUICK FIX: Evidence Lock Trigger

## Problem
Error saat upload: "evidence_url sudah terkunci dan tidak dapat diubah"

## Root Cause
Database trigger mencegah update `evidence_url` setelah upload pertama (security feature).

## Solution

### 1. Fix Application Code ✅
Mencegah re-upload di backend:

```php
// Check if already uploaded
if ($task->evidence_url) {
    return response()->json([
        'status' => 'error',
        'message' => 'Bukti foto sudah terkunci...'
    ], 403);
}
```

### 2. Migrate Existing Data
Jalankan di **Supabase SQL Editor**:

```sql
-- Update relative URLs to full URLs
UPDATE daily_tasks
SET evidence_url = 'http://localhost:8000' || evidence_url
WHERE evidence_url IS NOT NULL
  AND evidence_url NOT LIKE 'http%'
  AND evidence_url LIKE '/storage/%';
```

## What Changed
✅ `DailyTaskController::submit()` - Added evidence lock check
✅ Created SQL migration script

## Test
1. **Upload baru**: ✅ Berhasil dengan full URL
2. **Re-upload**: ✅ Error message (expected)
3. **Gambar lama**: ✅ Tampil dengan full URL

## Migration File
`Backend/document/Database/supabase_fix_relative_urls.sql`

---

See `HOTFIX_EVIDENCE_LOCK_TRIGGER.md` for complete details.
