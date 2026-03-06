# Divisions API

- **Endpoint**: `GET /api/divisions`
- **Auth**: Tidak butuh (Bebas akses)

Digunakan untuk mengambil daftar divisi yang tersedia di perusahaan. Biasanya dipakai di Frontend untuk menampilkan *dropdown* pilihan divisi saat Karyawan Baru sedang mendaftar di halaman pendaftaran.

## Headers Wajib
```json
{
    "Accept": "application/json"
}
```

## Response Sukses (200 OK)
```json
[
    {
        "id": "019cc113-...",
        "name": "Administrasi"
    },
    {
        "id": "019cc113-...",
        "name": "Customer Relation"
    },
    {
        "id": "019cc113-...",
        "name": "IT"
    },
    {
        "id": "019cc113-...",
        "name": "Marketing dan Partnership"
    },
    {
        "id": "019cc113-...",
        "name": "Media dan Production"
    },
    {
        "id": "019cc113-...",
        "name": "Public Relation"
    }
]
```
*(Array daftar id dan nama divisi, diurutkan berdasarkan abjad A-Z)*
