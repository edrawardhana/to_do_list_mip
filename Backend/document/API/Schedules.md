# Schedules (Jadwal Shift Harian) API

Setiap `intern` wajib memiliki *Shift Dinamis* per hari (`morning`, `afternoon`, atau `full`).
Wajib Header `Authorization: Bearer <token>`.

### A. Lihat Rekap Shift
`GET /api/schedules`
- Opsi filter berdasarkan hari: `?date=2026-10-14`
- Terfilter otomatis per divisi.

### B. Assign Shift (Admin/Super Admin)
`POST /api/schedules`
**Body JSON:**
```json
{
  "user_id": "uuid-intern-profil",
  "shift_date": "2026-10-14",
  "shift_type": "morning"
}
```
- Tipe shift: `morning`, `afternoon`, `full`.
- (Validasi) Tidak boleh 2 shift yang sama (overlap) per intern di hari yang sama.

### C. Update Shift
`PUT /api/schedules/{id}`
**Body JSON:**
```json
{
  "shift_date": "2026-10-14",
  "shift_type": "full"
}
```

### D. Delete/Kosongkan Shift
`DELETE /api/schedules/{id}`
