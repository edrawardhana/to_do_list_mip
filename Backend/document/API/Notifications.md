# Notifications (Sistem Pemberitahuan Personal)

Alert atau notifikasi sistem yang dikirim otomatis (oleh kode dalam Controller Laravel) kepada user bersangkutan akibat suatu *event* khusus (Misal: logbooknya direvisi Admin, pengajuan Izinnya ditolak).
Semua Request Wajib `Authorization: Bearer <token>`.

### A. Ambil Daftar Notifikasi
`GET /api/notifications`
- Mengembalikan notifikasi milik user.
- Tipe notif (Enum): `info`, `warning`, `success`, `danger`.

### B. Tandai Dibaca (Mark as Read)
`PUT /api/notifications/{id}`
**Body JSON:** 
```json
{
  "is_read": true
}
```

### C. Hapus Notifikasi Pribadi
`DELETE /api/notifications/{id}`
