# Dokumentasi Frontend - SiREKAP MIP

Dokumentasi ini menjelaskan konfigurasi, struktur folder, dan alur antarmuka pengguna (UI) dari aplikasi Frontend To-Do List & Logbook Magang MIP.

---

## Catatan Konfigurasi Penting: Supabase RLS & Custom Auth

### Masalah & Solusi
Aplikasi menggunakan custom authentication via Laravel backend (bukan Supabase Auth secara langsung). Akibatnya, `supabase.auth.getSession()` selalu mengembalikan `null`/`undefined` karena Supabase tidak mengenali sesi login yang dikelola Laravel.

Ketika RLS (Row Level Security) aktif di Supabase, semua query dari frontend yang tidak memiliki sesi Supabase valid akan ditolak dengan error 500 meskipun data di database ada.

**Solusi yang Diterapkan**:
Karena keamanan autentikasi sudah sepenuhnya dikelola oleh Laravel API Gateway & Middleware, RLS Supabase dinonaktifkan pada tabel `profiles`:
```sql
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
```

> **⚠️ Penting untuk Developer**: Keamanan data dijaga di level Laravel middleware & policy. Jika di masa depan ingin mengaktifkan RLS kembali, sistem login harus dimigrasi menggunakan `supabase.auth.signInWithPassword()` agar `auth.uid()` terisi dengan benar.

---

## Tech Stack & Dependensi
- **Framework**: React 19
- **Build Tool**: Vite 7
- **CSS Engine**: Tailwind CSS 3.4
- **HTTP Client**: Axios (dikonfigurasi dengan interceptor token auth di `src/api/axios.js`)
- **Utility**: FontAwesome v6 (untuk ikon), React Hot Toast (untuk notifikasi/toast)

---

## Cara Menjalankan di Lokal

1. **Masuk ke folder Frontend**:
   ```bash
   cd Frontend
   ```
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Konfigurasi Environment**:
   Buat file `.env` di folder `Frontend/` dengan isi:
   ```env
   VITE_API_URL=http://localhost:8000/api
   ```
4. **Jalankan development server**:
   ```bash
   npm run dev
   ```

Aplikasi frontend dapat diakses di `http://localhost:5173`.

---

## Struktur Folder Frontend

```text
Frontend/
  ├── src/
  │    ├── api/            # Konfigurasi axios.js
  │    ├── components/     # UI components (Navbar, Sidebar, InternTaskCard, dll)
  │    ├── contexts/       # AuthContext.jsx untuk mengelola sesi login & user info global
  │    ├── pages/          # Halaman Utama aplikasi
  │    │    ├── login/     # Halaman Login
  │    │    ├── intern/    # Dashboard Intern, InternTasks, InternLogbook, Absen
  │    │    ├── admin/     # Approval Center, AdminTaskCRUD
  │    │    └── dashboard/ # Halaman khusus Superadmin & Developer
  │    ├── App.jsx         # Root Router & Routing Guards
  │    └── main.jsx        # Entry point React
  ├── public/              # Gambar statis, ikon, & logo
  └── dokumentasi/         # File panduan teknis (file ini)
```

---

## Panduan Fitur di Antarmuka (UI)

1. **Daftar Tugas Intern (`InternTasks.jsx`)**:
   - Menampilkan list tugas hari ini yang di-generate dari template.
   - Apabila tugas merupakan kolaborasi bersama, nama rekan kerja yang dikonfirmasi akan ditampilkan di bawah detail tugas.
   - Status tugas dipetakan ke: `Todo` (belum dikerjakan), `Menunggu Rekan` (jika rekan kerja belum ACC tag), `Menunggu ACC` (menunggu validasi admin), `Selesai` (disetujui admin), dan `Revisi` (ditolak admin dengan feedback catatan).

2. **Approval Center Admin (`Approval.jsx`)**:
   - Terbagi menjadi tab "Laporan Tugas" dan "Pengajuan Izin".
   - Antrean laporan tugas hanya memuat tugas dengan status `pending` yang **telah dikirim** (`submitted_at` terisi).
   - Memiliki fitur "ACC" instan dan "Revisi/Tolak" dengan kolom pengisian alasan revisi untuk intern.
