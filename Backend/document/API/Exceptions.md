# Exceptions API (Pengganti Presensi Berhari-hari)

Menggantikan sistem absen lama. Pengajuan berbasis **1 kejadian per tanggal**.
Semua endpoint WAJIB Header `Authorization: Bearer <token>`.

### A. Lihat Daftar Exception
`GET /api/exceptions`
- Terfilter otomatis: 
  - `intern` hanya melihat miliknya.
  - `admin` melihat divisi miliknya.
  - `super_admin` melihat semua.
- Filter tanggal opsional: `?date=2026-10-14`

### B. Ajukan Permohonan (Khusus Intern)
`POST /api/exceptions`
**Body JSON:**
```json
{
  "type": "sakit", 
  "permission_date": "2026-10-14",
  "replacement_date": null,
  "description": "Sakit tipes, rawat inap",
  "evidence_url": "https://url.com/surat_dokter.jpg"
}
```
- Tipe yang diizinkan: `sakit`, `izin`, `tugas_luar`, `swap_shift`.
- `evidence_url` wajib diisi jika `type` adalah `sakit`.

### C. Proses Permohonan (Khusus Admin/Super Admin)
`PUT /api/exceptions/{id}`
**Body JSON:** 
```json
{
  "status": "approved"
}
```
- Tipe status: `approved`, `rejected`.
- **(Penting)**: Persetujuan (`approved`) untuk pengajuan hari-H dengan tipe `sakit` atau `izin` secara otomatis memicu Trigger Database yang berujung **Mengunci Akun Intern (`is_locked: true`)** pada hari tersebut. Intern dilarang mengisi logbook ketika izin.
