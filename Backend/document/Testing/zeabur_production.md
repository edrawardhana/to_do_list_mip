# Panduan Testing Backend (ZEABUR / PRODUCTION) ☁️

Ini adalah panduan bagaimana Frontend kamu bisa menembak API Backend yang sudah online dan live di Zeabur Cloud Server.

## 1. Konsep Dasar
Backend di Zeabur **selalu hidup 24 jam nonstop** di dalam Docker Container. Kamu **TIDAK PERLU** menjalankan perintah `php artisan serve` di area laptopmu untuk skenario testing Zeabur ini.

## 2. Cara Menyambungkan Frontend ke Zeabur
Berdasarkan aturan environment yang sudah kita buat, jika kamu ingin Frontend (baik itu masih berjalan di laptop lokalmu atau yang sudah live di Vercel) menembak API Zeabur, cukup setel `.env` Frontend kamu menjadi:

```env
VITE_API_URL=https://todolist-mip.zeabur.app/api
```
*(Seperti biasa, setiap kali `.env` diubah, matikan dan nyalakan lagi script `npm run dev`-nya).*

## 3. Cara Update Kodingan Backend ke Zeabur
Jika kamu telah selesai mensimulasikan perbaikan bug di Backend (melalui testing Lokal), alur mendeploy (memperbarui) Backend ke Zeabur sangatlah otomatis:

1. Di terminal VS Code, pastikan kamu berada di Repo Git (root path).
2. Ketik perintah wajib Github: `git add .`
3. Lalu: `git commit -m "Fix bug validasi password"`
4. Akhiri dengan: `git push origin main` (atau branch utama milikmu).

**Selesai!** 
Mesin Zeabur selalu me-milisik repo Github-mu. Saat Zeabur mendeteksi ada push kodenganan Backend yang baru mendarat, Zeabur akan secara otomatis merebuild Docker image dan merefresh server aplikasi Laravelnya. Semua itu terjadi di balik layar dalam hitungan menit tanpa campur tangan terminalmu.

## Kapan Menggunakan Alur Zeabur Ini?
- Saat fitur Backend memang sudah rampung dan stabil siap disajikan.
- Saat teman kerjamu (Frontender) sedang fokus ngoding pernak-pernik UI dan malas menghidupkan `php artisan serve` di komputernya.
