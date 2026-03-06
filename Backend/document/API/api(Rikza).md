# API Endpoints

Dokumentasi endpoint API yang tersedia saat ini.

---

## Base URL

- **Lokal**: `http://localhost:8000/api`
- **Production (Zeabur)**: `https://todolist-mip.zeabur.app/api`

---

## Status

Saat ini API masih dalam tahap kosong (clean state). Endpoint yang sudah ada hanya health check bawaan Laravel:

```
GET /up
```

Response kalau server nyala:

```json
{
    "status": "ok"
}
```

---

## Rencana Endpoint

Endpoint-endpoint berikut akan dibuat sesuai kebutuhan fitur:

| Fitur | Endpoint (rencana) | Keterangan |
|-------|-------------------|------------|
| Auth | `POST /api/login` | Login user |
| Auth | `POST /api/logout` | Logout user |
| Auth | `GET /api/me` | Data user yang login |
| Divisions | `GET /api/divisions` | Daftar divisi |
| Tasks | `GET /api/tasks` | Daftar tugas per divisi |
| Logbook | `GET /api/logbook` | Logbook entries user |
| Logbook | `POST /api/logbook` | Submit logbook baru |
| Shift Swap | `POST /api/shift-swaps` | Request tukar shift |
| Whiteboard | `GET /api/whiteboard` | Daftar whiteboard |
| Broadcasts | `GET /api/broadcasts` | Daftar pengumuman |

> Catatan: Endpoint di atas belum diimplementasi, hanya rencana. Akan ditambahkan seiring pengerjaan fitur.

---

## Format Response

Semua response API menggunakan format JSON:

```
Content-Type: application/json
Accept: application/json
```
