# Dokumentasi Frontend

Dokumentasi tentang project Frontend To-Do List MIP.

Berikut penjelasan singkat untuk dokumentasi:

🔐 Catatan Konfigurasi: Supabase RLS & Custom Auth
Masalah
Aplikasi menggunakan custom authentication via Laravel backend (bukan Supabase Auth). Akibatnya, supabase.auth.getSession() selalu mengembalikan null/undefined karena Supabase tidak mengenali sesi login yang dikelola Laravel.
Ketika RLS (Row Level Security) aktif di Supabase, semua query dari frontend yang tidak memiliki sesi Supabase valid akan ditolak dengan error 500 meskipun data di database ada.
Root Cause
Laravel Auth (JWT) ≠ Supabase Auth Session
→ auth.uid() = NULL
→ RLS policy gagal mengenali user
→ Query diblokir → Error 500
Solusi yang Diterapkan
Karena keamanan autentikasi sudah sepenuhnya dihandle oleh Laravel API, RLS Supabase dinonaktifkan pada tabel profiles:
sqlALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
⚠️ Penting untuk Developer

Jangan aktifkan RLS pada tabel manapun selama sistem masih menggunakan custom Laravel auth
Keamanan data dijaga di level Laravel middleware & policy, bukan di Supabase RLS
Jika di masa depan ingin mengaktifkan RLS, sistem login harus dimigrasi menggunakan supabase.auth.signInWithPassword() agar auth.uid() terisi dengan benar
---

## Tech Stack

| Komponen | Teknologi |
|----------|-----------|
| Framework | React 19 |
| Build Tool | Vite 7 |
| Bahasa | JavaScript (JSX) |
| Deployment | Zeabur / Vercel |

---

## Cara Menjalankan di Lokal

### 1. Masuk ke folder Frontend

```bash
cd to_do_list_mip/Frontend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Konfigurasi ENV

Buat file `.env` di folder `Frontend/` dengan isi:

```env
VITE_API_URL=http://localhost:8000/api
```

> Kalau mau langsung ke production, ganti ke `https://todolist-mip.zeabur.app/api`

### 4. Jalankan development server

```bash
npm run dev
```

Frontend jalan di `http://localhost:5173`.

---

## Struktur Folder

```
Frontend/
  src/
    App.jsx         -> Komponen utama (root)
    App.css         -> Styling untuk App
    index.css       -> Styling global
    main.jsx        -> Entry point React
    assets/         -> Gambar dan file statis
  public/           -> File publik (favicon, dll)
  document/         -> Dokumentasi (file ini)
  .env              -> Konfigurasi environment
  Dockerfile        -> Untuk deploy Docker
  zeabur.json       -> Config deploy Zeabur
  vercel.json       -> Config deploy Vercel
```

---

## Status Saat Ini

Frontend saat ini dalam kondisi **clean state** (tampilan default Vite React). Belum ada halaman fitur yang diimplementasi. Semua fitur lama (Login, Dashboard, Absen) sudah dihapus dan akan dibuat ulang sesuai kebutuhan baru.

---

## Deployment

Frontend bisa di-deploy ke:

- **Zeabur** - config ada di `zeabur.json`
- **Vercel** - config ada di `vercel.json`

Env variabel yang perlu diset di platform deployment:

```
VITE_API_URL=https://todolist-mip.zeabur.app/api
```

---

## Catatan

- Frontend menggunakan Vite, jadi variabel env harus prefix `VITE_` supaya bisa diakses di kode.
- Untuk build production: `npm run build` (output di folder `dist/`).
- Jangan lupa sesuaikan `VITE_API_URL` tergantung environment (lokal atau production).
