# ✅ QUICK FIX: Image URL Full Path

## Problem
Gambar tidak tampil di frontend (404 error)

## Root Cause
Backend menyimpan relative URL (`/storage/...`) tapi frontend di port berbeda.

## Solution
Gunakan full URL dengan `APP_URL`:

```php
// ❌ Before
$data['evidence_url'] = Storage::url($storagePath);
// Result: "/storage/task_evidence/..."

// ✅ After
$data['evidence_url'] = config('app.url') . Storage::url($storagePath);
// Result: "http://localhost:8000/storage/task_evidence/..."
```

## What Changed
✅ `DailyTaskController::submit()` - Line 286
✅ `DailyTaskController::update()` - Line 370

## Test
1. Upload foto di task
2. ✅ Gambar tampil di frontend
3. ✅ Klik "Lihat Bukti" membuka gambar

## Check
```bash
# Pastikan symbolic link ada
cd Backend
php artisan storage:link

# Pastikan APP_URL benar di .env
APP_URL=http://localhost:8000
```

---

See `HOTFIX_IMAGE_URL_FULL_PATH.md` for details.
