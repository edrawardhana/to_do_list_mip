# Dokumentasi Backend

Kumpulan dokumentasi untuk project Backend To-Do List MIP.

1. FE Menambahkan File kode CameraModal.jsx, yaitu mempersiapkan fitur open camera menggunakan sdk supabase
2. Membuat service upload untuk mengirim ke supabase storage
3. Menyiapkan logika validasi waktu agar tombol kamera hanya aktif dijam tertentu. sepakatnya akan dibuka dalam 24 jam hari itu juga. Jika sudah lewat harinya tombol kamera akan disabled


!!!!!masalah yang ditemukan di 18 maret 2026. sudah bisa menangkap foto tapi belum bisa mengirim ke database
---

## Daftar Dokumen

| File | Isi |
|------|-----|
| [setup.md](setup.md) | Cara setup project di lokal dan info deployment Zeabur |
| [database.md](Database/database.md) | Struktur database, tabel, relasi, dan koneksi Supabase |
| [trigger_auth.md](Database/trigger_auth.md) | Penjelasan otomatisasi `auth.users` ke tabel `profiles` (Trigger SQL) |
| [rls.md](Database/rls.md) | Penjelasan RLS (Row Level Security) per divisi |
| [api.md](API/api.md) | Daftar endpoint API yang tersedia |

---

## Tech Stack

| Komponen | Teknologi |
|----------|-----------|
| Framework | Laravel 12 |
| PHP | >= 8.2 |
| Database | PostgreSQL (Supabase) |
| Deployment | Zeabur |
