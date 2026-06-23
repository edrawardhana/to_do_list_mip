# SiREKAP MIP - To-Do List & Logbook Intern System

Sistem manajemen tugas harian (*logbook*) dan absensi untuk anak magang di MCC (MIP), yang dilengkapi dengan fitur kolaborasi tugas bersama (*collaborative tasks*), penandaan rekan shift, dan *approval* berdivisi dari Admin.

Sistem ini terbagi menjadi dua bagian utama:
1. **Backend**: Dibuat menggunakan Laravel 11, PostgreSQL, dan integrasi penyimpanan berkas bukti tugas (*evidences*) secara privat menggunakan Supabase Storage.
2. **Frontend**: Dibuat menggunakan React (Vite), Tailwind CSS, dan Axios.

---

## Fitur Utama

- **Otorisasi Berbasis Peran**:
  - `intern`: Melaporkan tugas harian, absensi/izin, menandai rekan kerja (*collaborative task*).
  - `admin` (Admin Divisi): Memvalidasi dan menyetujui (*ACC*) tugas harian & izin anak magang di divisinya sendiri.
  - `super_admin`: Mengelola master data divisi, template tugas harian, akun pengguna (intern/admin), serta memantau seluruh sistem.
- **Tugas Harian Bersama (Collaborative Task / Mention)**:
  - Intern dapat menandai (*mention*) rekan kerja saat mengirimkan tugas.
  - Rekan kerja yang di-tag mendapatkan waktu konfirmasi selama 10 menit. Jika tidak dikonfirmasi, data tag akan direset otomatis secara transparan.
- **Sistem Keamanan Berkas Bukti (Private Supabase Storage)**:
  - Berkas foto bukti tugas disimpan di bucket Supabase yang bersifat **Private**.
  - Menggunakan URL sementara (*pre-signed temporary URL*) dengan masa kedaluwarsa 20 menit, yang dioptimalkan dengan **caching 15 menit** di sisi backend untuk performa maksimal (menghindari lambatnya pembuatan tanda tangan S3).
- **Approval Center Terpusat & Cepat**:
  - Admin divisi hanya menyetujui tugas utama (*parent task*) untuk tugas bersama. Setelah disetujui, semua tugas rekan yang dikonfirmasi otomatis ikut disetujui (*Single-gate approval*).
  - Daftar antrean approval hanya memuat tugas yang benar-benar telah diserahkan (`submitted_at` tidak null) untuk menghindari kekacauan antrean.

---

## Struktur Folder

```text
to_do_list_mip/
├── Backend/               # API Engine (Laravel 11)
│   ├── app/
│   │   ├── Models/        # Model Eloquent (User, DailyTask, Exception, Division, dll)
│   │   └── Http/          # Controller & Middleware
│   ├── config/            # File Konfigurasi (filesystems, cache, dll)
│   └── routes/            # Rute API (/api)
├── Frontend/              # User Interface (React + Vite)
│   ├── src/
│   │   ├── components/    # Reusable UI Components
│   │   ├── pages/         # Halaman (intern, admin, dashboard, login)
│   │   └── contexts/      # State Global Auth
│   └── dokumentasi/       # Petunjuk penggunaan teknis
```

---

## Cara Menjalankan Aplikasi

### Persyaratan Awal
- PHP >= 8.2 & Composer
- Node.js >= 18 & npm
- PostgreSQL Database
- Akun Supabase (untuk database & storage)

### Langkah Setup Backend
1. Masuk ke direktori `Backend/`:
   ```bash
   cd Backend
   ```
2. Install dependensi:
   ```bash
   composer install
   ```
3. Salin berkas `.env` dan konfigurasikan database serta koneksi S3 Supabase:
   ```bash
   cp .env.example .env
   ```
4. Jalankan migrasi database beserta seeders:
   ```bash
   php artisan migrate --seed
   ```
5. Jalankan server lokal:
   ```bash
   php artisan serve
   ```

### Langkah Setup Frontend
1. Masuk ke direktori `Frontend/`:
   ```bash
   cd ../Frontend
   ```
2. Install dependensi:
   ```bash
   npm install
   ```
3. Buat file `.env` dan arahkan ke backend server:
   ```env
   VITE_API_URL=http://127.0.0.1:8000/api
   ```
4. Jalankan development server:
   ```bash
   npm run dev
   ```

---

## Keterangan Teknis Tambahan
- **Optimasi Caching**: Model `DailyTask.php` menyimpan URL bukti tugas di cache lokal menggunakan `Cache::remember` dengan durasi 900 detik (15 menit). Hal ini mencegah performa drop yang diakibatkan oleh pembuatan S3 signature di dalam perulangan data logbook.
- **Cronjob / Pemicu Otomatis**: Sistem menggunakan trigger database Postgres untuk generate tugas harian otomatis setiap harinya berdasarkan template divisi.
