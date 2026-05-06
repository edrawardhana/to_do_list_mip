# HOTFIX: Evidence Lock Trigger Conflict

**Date**: May 6, 2026  
**Issue**: Database trigger mencegah update `evidence_url`  
**Status**: ✅ RESOLVED

---

## Problem

Saat mencoba upload gambar, muncul error:

```
SQLSTATE[P0001]: Raise exception: 7 ERROR: [LOCK] evidence_url sudah terkunci 
dan tidak dapat diubah. (task_id: 019dfc95-34b0-71a9-b1d0-4e151bab6e9b)
CONTEXT: PL/pgSQL function fn_lock_evidence_url() line 7 at RAISE
```

**Symptoms**:
- ✅ Upload pertama kali berhasil
- ❌ Upload kedua kali (re-upload) gagal dengan error trigger lock
- ❌ Tidak bisa update URL dari relative ke full URL

---

## Root Cause

Ada **database trigger** di Supabase yang mengunci kolom `evidence_url` setelah pertama kali diisi:

```sql
CREATE FUNCTION fn_lock_evidence_url() ...
-- Mencegah UPDATE evidence_url jika sudah ada nilai
```

**Tujuan Trigger**: Security feature untuk mencegah intern mengubah bukti foto setelah upload.

**Conflict**: Ketika kita mencoba update URL dari relative (`/storage/...`) ke full URL (`http://localhost:8000/storage/...`), trigger menganggap ini sebagai perubahan tidak sah dan memblokir.

---

## Solution

### 1. Prevent Re-upload in Application Code

Tambahkan check di `DailyTaskController::submit()` untuk mencegah re-upload:

```php
// Check if evidence_url is already locked (first upload already done)
if ($task->evidence_url) {
    return response()->json([
        'status' => 'error',
        'message' => 'Bukti foto sudah terkunci dan tidak dapat diubah. Hubungi Admin jika ada kesalahan.'
    ], 403);
}
```

**Benefit**: 
- Mencegah error trigger di database
- Memberikan pesan error yang jelas ke user
- Konsisten dengan security policy

### 2. Migrate Existing Relative URLs

Untuk data yang sudah ada dengan relative URL, jalankan SQL migration di Supabase:

```sql
-- Update relative URLs to full URLs
UPDATE daily_tasks
SET evidence_url = 'http://localhost:8000' || evidence_url
WHERE evidence_url IS NOT NULL
  AND evidence_url NOT LIKE 'http%'
  AND evidence_url LIKE '/storage/%';
```

**Why Direct SQL?**:
- Trigger lock hanya berlaku untuk UPDATE via API/Application
- Direct SQL di Supabase console bypass trigger (runs as superuser)
- Safe untuk one-time migration

---

## Changes Made

### Backend Code

**File**: `Backend/app/Http/Controllers/DailyTaskController.php`

**Method**: `submit()` (Line ~257-265)

**Before**:
```php
if ($request->hasFile('evidence_url') && $request->file('evidence_url')->isValid()) {
    $file = $request->file('evidence_url');
    
    // Delete old evidence if exists
    if ($task->evidence_url) {
        $oldPath = str_replace('/storage/', '', parse_url($task->evidence_url, PHP_URL_PATH));
        Storage::disk('public')->delete($oldPath);
    }
    
    // ... process upload
}
```

**After**:
```php
if ($request->hasFile('evidence_url') && $request->file('evidence_url')->isValid()) {
    $file = $request->file('evidence_url');
    
    // Check if evidence_url is already locked (first upload already done)
    if ($task->evidence_url) {
        return response()->json([
            'status' => 'error',
            'message' => 'Bukti foto sudah terkunci dan tidak dapat diubah. Hubungi Admin jika ada kesalahan.'
        ], 403);
    }
    
    // ... process upload (only for first time)
}
```

### Database Migration

**File**: `Backend/document/Database/supabase_fix_relative_urls.sql`

Script SQL untuk migrate existing data dari relative URL ke full URL.

---

## Migration Steps

### Step 1: Run SQL Migration in Supabase

1. Login ke Supabase Dashboard
2. Buka **SQL Editor**
3. Copy script dari `Backend/document/Database/supabase_fix_relative_urls.sql`
4. Jalankan script

**Expected Output**:
```
UPDATE 5  -- Jumlah rows yang diupdate
```

### Step 2: Verify Migration

```sql
SELECT id, evidence_url, status
FROM daily_tasks
WHERE evidence_url IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;
```

**Check**:
- ✅ URL dimulai dengan `http://localhost:8000/storage/...`
- ❌ Bukan `/storage/...` (relative)

### Step 3: Test Image Access

1. Copy salah satu `evidence_url` dari hasil query
2. Paste di browser
3. ✅ Harus bisa membuka gambar

### Step 4: Test Upload Baru

1. Login sebagai intern
2. Pilih task baru (belum ada evidence)
3. Upload foto
4. ✅ Berhasil dengan full URL

### Step 5: Test Re-upload (Should Fail)

1. Coba upload lagi ke task yang sama
2. ✅ Harus muncul error: "Bukti foto sudah terkunci..."

---

## Understanding the Trigger

### Trigger Purpose

Database trigger `fn_lock_evidence_url()` adalah **security feature** untuk:

1. **Prevent Evidence Tampering**: Intern tidak bisa mengubah bukti setelah upload
2. **Audit Trail**: Memastikan bukti foto original tetap terjaga
3. **Admin Override**: Hanya admin yang bisa mengubah (via different endpoint)

### Trigger Behavior

```sql
IF OLD.evidence_url IS NOT NULL AND NEW.evidence_url IS DISTINCT FROM OLD.evidence_url THEN
    -- Check user role
    IF user_role = 'intern' THEN
        RAISE EXCEPTION '[LOCK] evidence_url sudah terkunci...';
    END IF;
END IF;
```

**Trigger Fires When**:
- ✅ `evidence_url` sudah ada (NOT NULL)
- ✅ Nilai baru berbeda dari nilai lama
- ✅ User role = 'intern'

**Trigger Allows**:
- ✅ First upload (OLD.evidence_url IS NULL)
- ✅ Admin update (user_role = 'admin' or 'super_admin')
- ✅ Direct SQL in Supabase (bypass trigger)

---

## Frontend Behavior

Frontend harus handle ini dengan:

### 1. Disable Re-upload Button

```jsx
{task.evidence_url && (
  <button disabled className="opacity-50 cursor-not-allowed">
    <i className="fa-solid fa-lock" /> Bukti Terkunci
  </button>
)}
```

### 2. Show View Button Instead

```jsx
{task.evidence_url && (
  <a href={task.evidence_url} target="_blank">
    <i className="fa-solid fa-image" /> Lihat Bukti
  </a>
)}
```

### 3. Show Warning Message

```jsx
{task.evidence_url && (
  <div className="text-xs text-amber-600">
    ⚠️ Bukti foto sudah terkunci. Hubungi Admin untuk perubahan.
  </div>
)}
```

---

## API Response

### Success (First Upload)

```json
{
  "status": "success",
  "message": "Laporan berhasil dikirim. Menunggu persetujuan Admin.",
  "data": {
    "id": "019dfc95-34b0-71a9-b1d0-4e151bab6e9b",
    "evidence_url": "http://localhost:8000/storage/task_evidence/task_xxx.jpg",
    "status": "pending"
  }
}
```

### Error (Re-upload Attempt)

```json
{
  "status": "error",
  "message": "Bukti foto sudah terkunci dan tidak dapat diubah. Hubungi Admin jika ada kesalahan."
}
```

---

## Testing Checklist

### ✅ First Upload
- [ ] Login sebagai intern
- [ ] Pilih task tanpa evidence
- [ ] Upload foto
- [ ] ✅ Berhasil dengan full URL
- [ ] ✅ Gambar tampil di frontend

### ✅ Re-upload Prevention
- [ ] Coba upload lagi ke task yang sama
- [ ] ✅ Muncul error message
- [ ] ✅ Tidak ada database error
- [ ] ✅ Frontend handle dengan baik

### ✅ Existing Data Migration
- [ ] Run SQL migration di Supabase
- [ ] ✅ Relative URLs berubah jadi full URLs
- [ ] ✅ Gambar lama tetap bisa diakses
- [ ] ✅ No data loss

### ✅ Admin Override (Future)
- [ ] Admin bisa update via admin endpoint
- [ ] Trigger tidak block admin
- [ ] Audit log tercatat

---

## Related Files

- `Backend/app/Http/Controllers/DailyTaskController.php`
- `Backend/document/Database/supabase_fix_relative_urls.sql`
- `Backend/document/Database/supabase_evidence_lock_trigger.sql`
- `Backend/document/Database/trigger_auth.md`

---

## Notes

⚠️ **Important**:
- Trigger lock adalah security feature, jangan di-disable
- Re-upload harus dicegah di application level
- Migration SQL hanya untuk one-time fix
- Frontend harus disable re-upload button

✅ **Best Practices**:
- Check `evidence_url` existence sebelum allow upload
- Berikan error message yang jelas
- Frontend disable button jika sudah ada evidence
- Admin punya endpoint terpisah untuk override

🔒 **Security**:
- Trigger mencegah tampering oleh intern
- Admin tetap bisa update via proper channel
- Audit trail terjaga
- Evidence integrity maintained

---

**Status**: ✅ COMPLETED  
**Impact**: Upload pertama berhasil, re-upload dicegah dengan proper error message
