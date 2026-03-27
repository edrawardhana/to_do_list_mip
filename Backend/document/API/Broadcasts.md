# Broadcasts (Global Announcements)

Pengumuman penting berskala nasional ke *semua* divisi tanpa kecuali.
Wajib Header `Authorization: Bearer <token>`.

### A. Akses Broadcast (Semua Role)
`GET /api/broadcasts`

### B. Buat Mading Global (Hanya Super Admin)
`POST /api/broadcasts`
**Body JSON:**
```json
{
  "title": "Libur Nasional Maulid Nabi", 
  "content": "Kantor pusat dan cabang ditutup", 
  "category": "urgent", 
  "expires_at": "2026-12-30"
}
```
- Category (Enum): `info`, `urgent`.

### C. Edit / Hapus (Hanya Super Admin)
`PUT /api/broadcasts/{id}`
`DELETE /api/broadcasts/{id}`
