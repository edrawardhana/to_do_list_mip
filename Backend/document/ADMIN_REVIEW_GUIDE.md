# Panduan Admin: Review Daily Task dengan Gambar Bukti

## 📋 Overview

Sebagai Admin Divisi, Anda dapat mereview dan menyetujui Daily Task (Logbook) yang dikirim oleh intern, termasuk melihat gambar bukti yang telah dikompres secara otomatis.

## 🔍 Cara Melihat Daily Task dari Intern

### 1. Ambil Daftar Daily Task

**Endpoint:** `GET /api/daily-tasks`

**Headers:**
```
Authorization: Bearer {your_admin_token}
```

**Query Parameters (Optional):**
- `date`: Filter berdasarkan tanggal (format: YYYY-MM-DD)
  - Contoh: `?date=2026-10-14`

**Request Example:**
```bash
curl -X GET "http://localhost:8000/api/daily-tasks?date=2026-10-14" \
  -H "Authorization: Bearer {admin_token}"
```

**Response:**
```json
{
  "status": "success",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "template_id": "660e8400-e29b-41d4-a716-446655440001",
      "uploader_id": "770e8400-e29b-41d4-a716-446655440002",
      "division_id": "880e8400-e29b-41d4-a716-446655440003",
      "evaluated_by": null,
      "task_date": "2026-10-14",
      "evidence_url": "/storage/task_evidence/task_550e8400_1729000000.jpg",
      "description": "Menyelesaikan modul login dan registrasi",
      "confirmed_participants": [],
      "status": "pending",
      "reject_reason": null,
      "is_archived": false,
      "captured_at": "2026-10-14T10:30:00Z",
      "created_at": "2026-10-14T08:00:00Z",
      "updated_at": "2026-10-14T10:30:00Z",
      "task_template": {
        "id": "660e8400-e29b-41d4-a716-446655440001",
        "task_name": "Development Task",
        "description": "Daily development progress"
      },
      "uploader": {
        "id": "770e8400-e29b-41d4-a716-446655440002",
        "full_name": "John Doe",
        "email": "john@example.com",
        "role": "intern"
      },
      "evaluator": null
    }
  ]
}
```

### 2. Akses Gambar Bukti

Gambar bukti dapat diakses melalui URL yang ada di field `evidence_url`.

**Format URL:**
```
{APP_URL}/storage/task_evidence/task_{task_id}_{timestamp}.jpg
```

**Contoh:**
```
http://localhost:8000/storage/task_evidence/task_550e8400_1729000000.jpg
```

**Cara Akses:**
1. **Via Browser:** Buka URL langsung di browser
2. **Via API Client:** Download file menggunakan HTTP GET request
3. **Via Frontend:** Tampilkan di `<img>` tag

**Contoh HTML:**
```html
<img src="http://localhost:8000/storage/task_evidence/task_550e8400_1729000000.jpg" 
     alt="Task Evidence" 
     style="max-width: 100%; height: auto;">
```

## ✅ Cara Approve/Reject Daily Task

### 1. Approve Task

**Endpoint:** `PUT /api/daily-tasks/{id}`

**Headers:**
```
Authorization: Bearer {your_admin_token}
Content-Type: application/json
```

**Body:**
```json
{
  "status": "approved"
}
```

**Request Example:**
```bash
curl -X PUT "http://localhost:8000/api/daily-tasks/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "approved"
  }'
```

**Response:**
```json
{
  "status": "success",
  "message": "Berhasil memperbarui logbook.",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "approved",
    "evaluated_by": "admin_uuid",
    "updated_at": "2026-10-14T11:00:00Z"
  }
}
```

### 2. Reject Task

**Body:**
```json
{
  "status": "rejected",
  "reject_reason": "Gambar bukti tidak jelas, mohon upload ulang dengan kualitas lebih baik"
}
```

**Request Example:**
```bash
curl -X PUT "http://localhost:8000/api/daily-tasks/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "rejected",
    "reject_reason": "Gambar bukti tidak jelas, mohon upload ulang dengan kualitas lebih baik"
  }'
```

### 3. Request Revision

**Body:**
```json
{
  "status": "revision",
  "reject_reason": "Mohon tambahkan deskripsi lebih detail tentang progress yang dicapai"
}
```

## 🖼️ Informasi Kompresi Gambar

### Spesifikasi Kompresi Otomatis

Semua gambar yang diupload oleh intern akan **otomatis dikompres** dengan spesifikasi:

| Parameter | Value | Keterangan |
|-----------|-------|------------|
| Format Output | JPEG | Semua gambar dikonversi ke JPEG |
| Kualitas | 80% | Balance antara ukuran dan kualitas visual |
| Max Width | 1920px | Gambar lebih besar akan diresize |
| Aspect Ratio | Maintained | Proporsi gambar tetap terjaga |

### Contoh Hasil Kompresi

**Before:**
- File: `photo.png`
- Size: 5.2 MB
- Dimensions: 4000x3000px

**After:**
- File: `task_uuid_timestamp.jpg`
- Size: ~800 KB (85% lebih kecil)
- Dimensions: 1920x1440px
- Quality: Tetap bagus untuk review

### Keuntungan untuk Admin

✅ **Loading Cepat:** Gambar lebih kecil = loading lebih cepat saat review  
✅ **Hemat Bandwidth:** Menghemat kuota internet  
✅ **Kualitas Tetap Baik:** Kualitas 80% masih sangat jelas untuk review  
✅ **Hemat Storage:** Server tidak cepat penuh  

## 🔒 Fitur Evidence Lock

### Apa itu Evidence Lock?

Evidence Lock adalah fitur keamanan yang **mencegah intern mengubah foto bukti** setelah foto pertama kali diupload.

### Cara Kerja

1. **Intern upload foto pertama kali** → ✅ Berhasil
2. **Intern coba upload foto baru** → ❌ Ditolak dengan error 403
3. **Admin bisa update foto** → ✅ Berhasil (jika ada kesalahan)

### Error Message untuk Intern

```json
{
  "status": "error",
  "message": "Bukti foto sudah dikunci permanen oleh sistem dan tidak dapat diubah lagi. Hubungi Admin Jika ada keliruan.",
  "system_error": "TRIGGER_EVIDENCE_LOCK"
}
```

### Admin Override (Jika Diperlukan)

Jika intern salah upload foto, **hanya admin** yang bisa mengupdate:

**Endpoint:** `PUT /api/daily-tasks/{id}`

**Content-Type:** `multipart/form-data`

**Body:**
- `evidence_url`: File gambar baru (akan dikompres otomatis)

**Request Example:**
```bash
curl -X PUT "http://localhost:8000/api/daily-tasks/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer {admin_token}" \
  -F "evidence_url=@/path/to/correct_photo.jpg"
```

## 📊 Filter dan Sorting

### Filter by Date

```bash
GET /api/daily-tasks?date=2026-10-14
```

### Filter by Status (via Frontend)

Response sudah include field `status`, frontend bisa filter:
- `pending`: Menunggu review
- `approved`: Sudah disetujui
- `rejected`: Ditolak
- `revision`: Perlu revisi

### Filter by Intern (via Frontend)

Response sudah include `uploader` object, frontend bisa filter berdasarkan nama intern.

## 🚨 Troubleshooting

### Gambar Tidak Muncul

**Problem:** URL gambar return 404

**Solution:**
1. Pastikan symbolic link sudah dibuat:
   ```bash
   php artisan storage:link
   ```
2. Cek file ada di: `storage/app/public/task_evidence/`
3. Pastikan `APP_URL` di `.env` sudah benar

### Gambar Terlalu Besar

**Problem:** Gambar masih terlalu besar setelah kompresi

**Solution:**
- Kompresi otomatis sudah aktif (JPEG 80%, max 1920px)
- Jika masih besar, mungkin gambar asli sangat besar (>10MB)
- Bisa adjust kualitas di controller (ubah `quality: 80` ke `quality: 60`)

### Tidak Bisa Approve Task

**Problem:** Error 403 saat approve

**Solution:**
1. Pastikan Anda login sebagai admin
2. Pastikan task ada di divisi Anda
3. Cek token JWT masih valid

## 📱 Integrasi dengan Frontend

### React/Vue Example

```javascript
// Fetch daily tasks
const fetchDailyTasks = async (date) => {
  const response = await fetch(
    `${API_URL}/api/daily-tasks?date=${date}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  const data = await response.json();
  return data.data;
};

// Display image
const TaskImage = ({ evidenceUrl }) => {
  const fullUrl = `${API_URL}${evidenceUrl}`;
  
  return (
    <img 
      src={fullUrl} 
      alt="Task Evidence"
      style={{ maxWidth: '100%', height: 'auto' }}
      onError={(e) => {
        e.target.src = '/placeholder-image.png';
      }}
    />
  );
};

// Approve task
const approveTask = async (taskId) => {
  const response = await fetch(
    `${API_URL}/api/daily-tasks/${taskId}`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: 'approved'
      })
    }
  );
  return await response.json();
};

// Reject task
const rejectTask = async (taskId, reason) => {
  const response = await fetch(
    `${API_URL}/api/daily-tasks/${taskId}`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: 'rejected',
        reject_reason: reason
      })
    }
  );
  return await response.json();
};
```

## 📞 Support

Jika ada masalah atau pertanyaan, hubungi:
- Developer Team
- Email: developer@mip.co.id
