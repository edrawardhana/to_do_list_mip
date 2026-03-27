# Whiteboards (Papan Pengumuman Divisi)

Berbagi *file*, PDF, instruksi SOP, atau *image* yang sifatnya rahasia *internal* divisi saja.
Wajib Header `Authorization: Bearer <token>`.

### A. Lihat Papan (Semua User)
`GET /api/whiteboards`
- Dibatasi hanya menampilkan postingan pada Divisinya sendiri (kecuali `super_admin`).

### B. Tambah Mading (Khusus Admin/Super Admin)
`POST /api/whiteboards`
**Body JSON:** 
```json
{
  "title": "SOP Penggunaan Server Utama V2", 
  "file_url": "https://...", 
  "type": "pdf"
}
```
- Tipe aset yang diizinkan (Enum DB): `pdf`, `image`, `link`.

### C. Update (Khusus Admin)
`PUT /api/whiteboards/{id}`

### D. Delete (Khusus Admin)
`DELETE /api/whiteboards/{id}`
