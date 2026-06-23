# Daily Tasks (Logbook Laporan) API

Logbook harian untuk merekap progress `intern`.
Digenerate otomatis oleh cron job setiap hari (jam 00:00), atau bisa ditambahkan secara eksplisit manual.
Wajib Header `Authorization: Bearer <token>`.

### A. Lihat Daftar Tugas
`GET /api/daily-tasks`
- Otomatis difilter dan divalidasi oleh Controller (Data Isolation berdasar Divisi / Kepemilikan).
- Filter tanggal opsional: `?date=2026-10-14`
- Filter status opsional: `?status=pending` (pending, approved, rejected, revision)
- Filter intern opsional: `?uploader_id=uuid-intern` (hanya untuk admin/superadmin)

**Response:**
```json
{
  "status": "success",
  "data": [
    {
      "id": "uuid",
      "template_id": "uuid-template",
      "uploader_id": "uuid-user",
      "division_id": "uuid-division",
      "evaluated_by": "uuid-admin",
      "assigned_by": "uuid-admin",
      "task_date": "2026-10-14",
      "evidence_url": "/storage/task_evidence/task_uuid_timestamp.jpg",
      "description": "Progress selesai 80%",
      "confirmed_participants": ["uuid1", "uuid2"],
      "status": "pending",
      "reject_reason": null,
      "is_archived": false,
      "captured_at": "2026-10-14T10:30:00Z",
      "assign_note": "Selesaikan modul login sebelum jam 5 sore",
      "created_at": "2026-10-14T08:00:00Z",
      "updated_at": "2026-10-14T10:30:00Z",
      "task_template": {
        "id": "uuid",
        "title": "Development Task",
        "description": "Daily development progress"
      },
      "uploader": {
        "id": "uuid",
        "full_name": "John Doe",
        "email": "john@example.com",
        "role": "intern"
      },
      "evaluator": null,
      "assigned_by": {
        "id": "uuid",
        "full_name": "Admin Name",
        "role": "admin"
      }
    }
  ]
}
```

### A1. Admin Membagikan Tugas ke Intern
`POST /api/daily-tasks/assign`

**⚠️ HANYA ADMIN/SUPERADMIN yang dapat menggunakan endpoint ini!**

**Headers:**
```
Authorization: Bearer {admin_token}
Content-Type: application/json
```

**Body:**
```json
{
  "template_id": "uuid-template",
  "intern_ids": ["uuid-intern1", "uuid-intern2", "uuid-intern3"],
  "task_date": "2026-10-14",
  "assign_note": "Selesaikan modul login sebelum jam 5 sore"
}
```

**Parameters:**
- `template_id` (required, uuid): ID template tugas yang akan dibagikan
- `intern_ids` (required, array): Array UUID intern yang akan menerima tugas
- `task_date` (required, date): Tanggal tugas (format: YYYY-MM-DD)
- `assign_note` (optional, string): Catatan khusus dari admin untuk tugas ini

**Response Success:**
```json
{
  "status": "success",
  "message": "3 tugas berhasil dibagikan.",
  "data": {
    "created_tasks": [
      {
        "id": "uuid1",
        "uploader_id": "uuid-intern1",
        "template_id": "uuid-template",
        "task_date": "2026-10-14",
        "status": "pending",
        "assign_note": "Selesaikan modul login sebelum jam 5 sore",
        "assigned_by": "uuid-admin"
      },
      {
        "id": "uuid2",
        "uploader_id": "uuid-intern2",
        "template_id": "uuid-template",
        "task_date": "2026-10-14",
        "status": "pending",
        "assign_note": "Selesaikan modul login sebelum jam 5 sore",
        "assigned_by": "uuid-admin"
      }
    ],
    "errors": [
      "Tugas sudah ada untuk Jane Doe pada tanggal ini."
    ]
  }
}
```

**Response Error (Not Admin):**
```json
{
  "status": "error",
  "message": "Hanya Admin yang dapat membagikan tugas."
}
```

**Response Error (Wrong Division):**
```json
{
  "status": "error",
  "message": "Anda hanya dapat membagikan tugas dalam divisi Anda."
}
```

**Contoh Request (cURL):**
```bash
curl -X POST "http://localhost:8000/api/daily-tasks/assign" \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "template_id": "550e8400-e29b-41d4-a716-446655440001",
    "intern_ids": [
      "660e8400-e29b-41d4-a716-446655440002",
      "770e8400-e29b-41d4-a716-446655440003"
    ],
    "task_date": "2026-10-14",
    "assign_note": "Prioritas tinggi - deadline hari ini"
  }'
```

**Use Cases:**
- Admin membagikan tugas khusus ke intern tertentu
- Admin membagikan tugas urgent ke beberapa intern sekaligus
- Admin membagikan tugas dengan deadline spesifik
- Admin membagikan tugas dengan instruksi khusus

**Validasi:**
- ✅ Admin hanya bisa assign task dalam divisinya sendiri
- ✅ Tidak bisa assign task yang sudah ada untuk intern pada tanggal yang sama
- ✅ Intern harus dalam divisi yang sama dengan admin (untuk role admin)
- ✅ Template task harus ada dan aktif

### B. Tambah Tugas Logbook (Manual)
`POST /api/daily-tasks`
**Body JSON:**
```json
{
  "template_id": "uuid-template",
  "task_date": "2026-10-14",
  "description": null,
  "evidence_url": null,
  "confirmed_participants": []
}
```

### C. Submit Logbook dengan Upload Foto (Oleh Intern)
`POST /api/daily-tasks/{id}/submit`

**⚠️ GUNAKAN ENDPOINT INI untuk upload foto bukti!**

**Content-Type:** `multipart/form-data`

**Body Form Data:**
- `description` (required, string): Deskripsi progress tugas
- `evidence_url` (optional, file): File gambar bukti (JPEG, JPG, PNG, GIF, WEBP)
  - Max size: 10MB
  - **Otomatis dikompres** menjadi JPEG dengan kualitas 80%
  - **Otomatis diresize** jika lebar > 1920px (maintain aspect ratio)
  - Gambar lama akan otomatis dihapus saat upload gambar baru

**Contoh Request (cURL):**
```bash
curl -X POST "http://localhost:8000/api/daily-tasks/{id}/submit" \
  -H "Authorization: Bearer {token}" \
  -F "description=Progress selesai 80% pada modul C" \
  -F "evidence_url=@/path/to/photo.jpg"
```

**Response Success:**
```json
{
  "status": "success",
  "message": "Laporan berhasil dikirim. Menunggu persetujuan Admin.",
  "data": {
    "id": "uuid",
    "description": "Progress selesai 80% pada modul C",
    "evidence_url": "/storage/task_evidence/task_uuid_1234567890.jpg",
    "status": "pending",
    "updated_at": "2026-10-14T10:30:00Z"
  }
}
```

**Response Error (Already Approved):**
```json
{
  "status": "error",
  "message": "Tugas sudah di-ACC dan tidak dapat diubah."
}
```

**[🚨 PENTING - TRIGGER PENYEGELAN FOTO BUKTI / EVIDENCE LOCK]**
- Foto bukti (`evidence_url`) **TIDAK BISA** ditimpa secara diam-diam. Jika sudah pernah terisi dan `intern` mencoba `PUT` update baru, Database Trigger Supabase akan merespon dengan `HTTP 403 Forbidden`.
- Hanya Admin / HRD yang bisa merevisi *field* foto tersebut jika ada kesalahan.

### D. Update Progress & Upload Foto (Alternative - PUT Method)
`PUT /api/daily-tasks/{id}`

**Content-Type:** `multipart/form-data`

**Body Form Data:**
- `description` (optional, string): Deskripsi progress
- `evidence_url` (optional, file): File gambar bukti
  - Format: JPEG, JPG, PNG, GIF, WEBP
  - Max size: 10MB
  - **Otomatis dikompres** dan diresize
- `confirmed_participants` (optional, array): Array UUID peserta
- `is_archived` (optional, boolean): Status arsip

**Catatan:** Untuk upload foto, **lebih disarankan menggunakan endpoint `/submit`** karena lebih reliable untuk POST request dengan file upload.

### E. Evaluasi Logbook (Admin)
`PUT /api/daily-tasks/{id}`

**Content-Type:** `application/json` atau `multipart/form-data`

**Body JSON:**
```json
{
  "status": "approved", 
  "reject_reason": "Kurang detail"
}
```

**Body Form Data (jika perlu update foto juga):**
- `status` (optional): `pending`, `approved`, `rejected`, `revision`
- `reject_reason` (optional, string): Alasan reject/revisi
- `evidence_url` (optional, file): Update foto bukti (hanya admin yang bisa update foto yang sudah di-lock)

**Response:**
```json
{
  "status": "success",
  "message": "Berhasil memperbarui logbook.",
  "data": {
    "id": "uuid",
    "status": "approved",
    "evaluated_by": "uuid-admin",
    "updated_at": "2026-10-14T11:00:00Z"
  }
}
```

- Admin memberikan status: `pending`, `approved`, `rejected`, atau minta `revision`.
- Mengubah status (selain `pending`) akan otomatis merekam ID Admin ke kolom `evaluated_by`.
- Admin dapat mengupdate foto bukti yang sudah di-lock oleh trigger database.

### F. Fitur Kompresi Gambar

**Spesifikasi Kompresi:**
- Format output: JPEG
- Kualitas: 80%
- Max width: 1920px (height auto-scaled untuk maintain aspect ratio)
- Ukuran file berkurang signifikan (biasanya 60-80% lebih kecil)

**Keuntungan:**
- ✅ Hemat storage space
- ✅ Loading lebih cepat untuk admin saat review
- ✅ Hemat bandwidth
- ✅ Tetap menjaga kualitas visual yang baik

**Contoh:**
- Input: `photo.png` (5.2 MB, 4000x3000px)
- Output: `task_uuid_timestamp.jpg` (800 KB, 1920x1440px, JPEG 80%)
