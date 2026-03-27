# System Configs API (Variabel Global Dinamis)

Penyimpanan konfigurasi global secara dinamis (tanpa perlu hardcode source .env).
Wajib Header `Authorization: Bearer <token>`.

### A. Ambil Rekap Konfigurasi Server
`GET /api/system-configs`
- Bisa diakses semua user untuk melihat *state* aturan sistem.
Contoh Respons:
```json
[
  { "key": "daily_task_due_time", "value": "17:30" },
  { "key": "maintenance_mode", "value": "false" }
]
```

### B. Ubah Konfigurasi (Hanya Super Admin & Admin)
`PUT /api/system-configs/{key}`
**Body JSON:** 
```json
{
  "value": "17:30"
}
```
- Endpoint diakses menggunakan `key` primary secara langsung (bukan UUID).
