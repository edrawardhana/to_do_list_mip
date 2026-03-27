# Task Templates (Daftar Tugas Default)

Template daftar rutinitas yang akan ditarik oleh CronJob Supabase (jam 00:00) untuk dimasukkan sebagai logbook harian intern. Di-handle/diatur oleh Admin.
Semua Endpoint Wajib Header `Authorization: Bearer <token>`.

### A. Lihat Daftar Template
`GET /api/task-templates`
- Mengembalikan template milik divisinya sendiri.

### B. Buat Template (Khusus Admin/Super Admin)
`POST /api/task-templates`
**Body JSON:**
```json
{
  "title": "Beres-beres Lab", 
  "description": "Menyapu, pel lantai, nyalakan AC", 
  "is_active": true
}
```
- Jika Role `super_admin`, wajib menyertakan `"division_id"`.

### C. Update / Nonaktifkan Template
`PUT /api/task-templates/{id}`
**Body JSON:**
```json
{
  "is_active": false
}
```

### D. Delete Template
`DELETE /api/task-templates/{id}`
