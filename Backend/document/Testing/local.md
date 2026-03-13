# Panduan Testing Backend (LOKAL) 💻

Ini adalah cara untuk mengetes dan menjalankan Backend jika kamu sedang ngoding fitur baru di laptop (Local Development).

## 1. Persiapan Terminal
Buka terminal baru di folder `Backend`. Biarkan terminal Frontend berjalan terpisah di kolom lainnya.

## 2. Nyalakan Server Backend
Jalankan perintah wajib ini di dalam folder `Backend`:
```bash
php artisan serve
```
Backend kamu akan secara lokal hidup di URL: `http://localhost:8000`

## 3. Sambungkan Frontend ke Lokal
Agar Frontend bisa menembak Backend lokal ini, buka file `.env` yang ada di folder **Frontend**, dan ubah isinya menjadi:
```env
VITE_API_URL=http://localhost:8000/api
```
*(Ingat: Kalau kamu mengubah `.env` di Frontend, terminal `npm run dev` Frontend-nya harus distop dulu lalu dinyalakan ulang / di-restart agar membaca konfigurasi URL yang baru).*

## Kapan Menggunakan Alur Lokal Ini?
- Saat kamu bereksperimen mengganti kode di `routes` atau `Controllers` Backend.
- Saat kamu mau melihat print-out / log error langsung di layar komputermu sendiri.
- Saat menguji keamanan fitur sebelum *"git push"* kodenya ke Github Master.
