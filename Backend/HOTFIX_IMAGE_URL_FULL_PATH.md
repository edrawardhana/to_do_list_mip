# HOTFIX: Image URL Full Path for Frontend

**Date**: May 6, 2026  
**Issue**: Gambar tidak tampil di frontend  
**Status**: ✅ RESOLVED

---

## Problem

Gambar berhasil diupload dan disimpan di backend, tetapi tidak tampil di frontend React.

**Symptoms**:
- ✅ Task berhasil dikirim
- ✅ File tersimpan di `storage/app/public/task_evidence/`
- ❌ Gambar tidak tampil di UI
- ❌ Browser menunjukkan 404 error untuk image URL

---

## Root Cause

Backend menyimpan **relative URL** (`/storage/task_evidence/...`) ke database, tetapi frontend React berjalan di port berbeda dari backend Laravel.

**Architecture**:
- Backend Laravel: `http://localhost:8000`
- Frontend React: `http://localhost:5173` (atau port lain)

**Problem**:
```php
// ❌ SALAH - Relative URL
$data['evidence_url'] = Storage::url($storagePath);
// Result: "/storage/task_evidence/task_123_456.jpg"
// Frontend mencoba: http://localhost:5173/storage/... (404!)
```

Frontend mencoba mengakses gambar dari domain sendiri, bukan dari backend.

---

## Solution

Menggunakan **full URL** dengan `APP_URL` dari config:

```php
// ✅ BENAR - Full URL
$data['evidence_url'] = config('app.url') . Storage::url($storagePath);
// Result: "http://localhost:8000/storage/task_evidence/task_123_456.jpg"
// Frontend mengakses: http://localhost:8000/storage/... (✅ Works!)
```

---

## Changes Made

### DailyTaskController.php

#### Method: `submit()` (Line ~285)

**Before**:
```php
Storage::disk('public')->put($storagePath, (string) $encodedImage);
$data['evidence_url'] = Storage::url($storagePath);
```

**After**:
```php
Storage::disk('public')->put($storagePath, (string) $encodedImage);
// Generate full URL for frontend access
$data['evidence_url'] = config('app.url') . Storage::url($storagePath);
```

#### Method: `update()` (Line ~369)

**Before**:
```php
Storage::disk('public')->put($storagePath, (string) $encodedImage);
$dataToUpdate['evidence_url'] = Storage::url($storagePath);
```

**After**:
```php
Storage::disk('public')->put($storagePath, (string) $encodedImage);
// Generate full URL for frontend access
$dataToUpdate['evidence_url'] = config('app.url') . Storage::url($storagePath);
```

---

## Configuration Required

### Backend: .env

Pastikan `APP_URL` diset dengan benar:

```env
APP_URL=http://localhost:8000
```

**Production**:
```env
APP_URL=https://your-domain.com
```

### Symbolic Link

Pastikan symbolic link sudah dibuat:
```bash
cd Backend
php artisan storage:link
```

Output:
```
The [public/storage] link has been connected to [storage/app/public].
```

---

## URL Format Examples

### Development
```
http://localhost:8000/storage/task_evidence/task_abc123_1715000000.jpg
```

### Production
```
https://api.yourdomain.com/storage/task_evidence/task_abc123_1715000000.jpg
```

---

## Testing

### 1. Upload Image
1. Login sebagai intern
2. Pilih task
3. Upload foto
4. Submit

### 2. Check Database
```sql
SELECT id, evidence_url FROM daily_tasks WHERE evidence_url IS NOT NULL LIMIT 1;
```

Expected:
```
http://localhost:8000/storage/task_evidence/task_xxx_xxx.jpg
```

### 3. Check Frontend
- Gambar harus tampil di card task
- Klik "Lihat Bukti" harus membuka gambar
- No 404 errors di browser console

### 4. Direct Access
Buka URL gambar langsung di browser:
```
http://localhost:8000/storage/task_evidence/task_xxx_xxx.jpg
```

Harus menampilkan gambar, bukan 404.

---

## Troubleshooting

### Gambar Masih 404

**Check 1: Symbolic Link**
```bash
cd Backend/public
ls -la storage
```

Harus ada link ke `../storage/app/public`

**Windows**:
```powershell
cd Backend\public
dir storage
```

**Check 2: File Exists**
```bash
cd Backend/storage/app/public/task_evidence
ls -la
```

Harus ada file `.jpg`

**Check 3: APP_URL**
```bash
cd Backend
php artisan config:clear
php artisan config:cache
```

**Check 4: Permissions** (Linux/Mac)
```bash
chmod -R 755 storage
chmod -R 755 bootstrap/cache
```

### CORS Issues

Jika gambar tidak load karena CORS, tambahkan di `config/cors.php`:

```php
'paths' => ['api/*', 'storage/*', 'sanctum/csrf-cookie'],
```

---

## Related Files

- `Backend/app/Http/Controllers/DailyTaskController.php`
- `Backend/.env` (APP_URL configuration)
- `Backend/config/filesystems.php`
- `Backend/public/storage` (symbolic link)

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ Frontend (React)                                            │
│ http://localhost:5173                                       │
│                                                             │
│  <img src="http://localhost:8000/storage/..." />           │
│           │                                                 │
│           └──────────────────────────────────┐              │
└──────────────────────────────────────────────┼──────────────┘
                                               │
                                               ▼
┌─────────────────────────────────────────────────────────────┐
│ Backend (Laravel)                                           │
│ http://localhost:8000                                       │
│                                                             │
│  public/storage  ──symlink──▶  storage/app/public          │
│                                      │                      │
│                                      └─ task_evidence/      │
│                                            └─ task_*.jpg    │
└─────────────────────────────────────────────────────────────┘
```

---

## Notes

⚠️ **Important**:
- Selalu gunakan full URL untuk cross-origin access
- `Storage::url()` menghasilkan relative URL (`/storage/...`)
- `config('app.url')` mengambil dari `.env` file
- Symbolic link wajib dibuat dengan `php artisan storage:link`

✅ **Best Practices**:
- Set `APP_URL` sesuai environment (dev/staging/prod)
- Gunakan environment variables untuk URL configuration
- Test image access dari frontend setelah upload
- Check browser console untuk CORS atau 404 errors

---

**Status**: ✅ COMPLETED  
**Impact**: Gambar sekarang tampil dengan benar di frontend
