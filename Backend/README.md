# SiREKAP MIP - Backend API (Laravel 11)

Layanan Backend API berbasis Laravel 11 untuk sistem To-Do List & Logbook Magang MIP. Layanan ini mengelola autentikasi pengguna, penyimpanan data tugas harian, integrasi bucket Supabase, absensi/izin, serta kelola data master divisi dan template tugas.

---

## Tech Stack & Dependensi
- **Framework**: Laravel 11
- **Database**: PostgreSQL (Supabase / Lokal)
- **File Storage**: AWS S3 SDK integration for Supabase Storage (`league/flysystem-aws-s3-v3`)
- **Autentikasi**: Laravel Sanctum / Custom JWT Token
- **Caching**: File Cache Driver (dikonfigurasikan di `.env` via `CACHE_STORE=file`)

---

## Konfigurasi Kunci Environment (`.env`)

Pastikan variabel-variabel berikut terisi dengan benar di berkas `.env` Anda:

```env
DB_CONNECTION=pgsql
DB_HOST=your-postgres-host
DB_PORT=5432
DB_DATABASE=your-database-name
DB_USERNAME=your-username
DB_PASSWORD=your-password

# Caching Store
CACHE_STORE=file

# Supabase Storage Integration via S3 driver
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-service-role-key
SUPABASE_BUCKET=evidences

# AWS S3 kompatibel untuk Supabase
AWS_ACCESS_KEY_ID=your-supabase-s3-access-key-id
AWS_SECRET_ACCESS_KEY=your-supabase-s3-secret-access-key
AWS_DEFAULT_REGION=ap-southeast-1
AWS_BUCKET=evidences
AWS_ENDPOINT=https://your-project.supabase.co/storage/v1/s3
AWS_USE_PATH_STYLE_ENDPOINT=true
```

---

## Fitur Teknis Utama Backend

1. **Caching URL Gambar Privat**:
   Untuk mempercepat serialisasi data JSON logbook tugas harian, accessor `getEvidenceUrlAttribute` di model `DailyTask.php` membungkus pemanggilan `Storage::temporaryUrl()` dalam `Cache::remember` dengan durasi 15 menit (900 detik). Hal ini mencegah backend menandatangani ulang URL bukti ke S3 pada setiap baris data yang dibaca.

2. **Trigger Generator Tugas Harian**:
   Terdapat migrasi SQL yang mendaftarkan trigger PostgreSQL `fn_generate_daily_tasks` untuk secara otomatis menghasilkan data baris tugas kosong pada pukul 00:00 setiap harinya untuk setiap mahasiswa magang terdaftar berdasarkan template tugas aktif milik divisi mereka.

3. **Logika Kolaborasi Lintas Divisi**:
   Jika intern A (Divisi 1) menandai intern B (Divisi 2) di tugas bersama:
   - Sistem akan membuat data tugas B di bawah koordinat Divisi 2 (`division_id = Divisi 2`) agar Admin Divisi 2 dapat melihat dan mengonfirmasi tugas milik anggotanya sendiri.
   - Status tugas bersama diatur ke `waiting_confirmation` selama 10 menit sebelum divalidasi ke status `pending` untuk Admin.

---

## Endpoint API Penting

- `POST /api/login` - Login pengguna (mengembalikan data user dan token).
- `GET /api/daily-tasks` - Mengambil logbook tugas harian (intern melihat tugasnya, admin melihat tugas divisinya, superadmin melihat semua).
- `POST /api/daily-tasks/store` - Pembuatan tugas ad-hoc/urgent.
- `POST /api/daily-tasks/{id}/submit` - Intern menyerahkan bukti foto & catatan tugas.
- `PUT /api/daily-tasks/{id}/confirm` - Rekan shift mengonfirmasi keikutsertaan tugas bersama.
- `PUT /api/daily-tasks/{id}` - Admin menyetujui (*ACC*) atau memberikan catatan revisi pada tugas.
- `GET /api/exceptions` - Mengambil daftar pengajuan izin / sakit / tugas luar.
