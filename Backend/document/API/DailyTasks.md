# Daily Tasks (Logbook Laporan) API

Logbook harian untuk merekap progress `intern`.
Digenerate otomatis oleh cron job setiap hari (jam 00:00), atau bisa ditambahkan secara eksplisit manual.
Wajib Header `Authorization: Bearer <token>`.

### A. Lihat Daftar Tugas
`GET /api/daily-tasks`
- Otomatis difilter dan divalidasi oleh Controller (Data Isolation berdasar Divisi / Kepemilikan).
- Filter tanggal opsional: `?date=2026-10-14`

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

### C. Update Progress & Upload Foto (Oleh Intern)
`PUT /api/daily-tasks/{id}`
**Body JSON:**
```json
{
  "description": "Progress selesai 80% pada modul C",
  "evidence_url": "https://url.com/bukti.jpg",
  "confirmed_participants": ["uuid_teman1", "uuid_teman2"]
}
```
**[🚨 PENTING - TRIGGER PENYEGELAN FOTO BUKTI / EVIDENCE LOCK]**
- Foto bukti (`evidence_url`) **TIDAK BISA** ditimpa secara diam-diam. Jika sudah pernah terisi dan `intern` mencoba `PUT` update baru, Database Trigger Supabase akan merespon dengan `HTTP 403 Forbidden`.
- Hanya Admin / HRD yang bisa merevisi *field* foto tersebut jika ada kesalahan.

### D. Evaluasi Logbook (Admin)
`PUT /api/daily-tasks/{id}`
**Body JSON:**
```json
{
  "status": "approved", 
  "reject_reason": "Kurang detail"
}
```
- Admin memberikan status: `pending`, `approved`, `rejected`, atau minta `revision`.
- Mengubah status (selain `pending`) akan otomatis merekam ID Admin ke kolom `evaluated_by`.
