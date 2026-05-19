# Panduan Akses Project dari Device Lain 📱💻

Dokumen ini menjelaskan beberapa metode termudah untuk mengakses aplikasi **To-Do List MIP** (baik Frontend React maupun Backend Laravel) dari perangkat lain seperti Smartphone (Android/iOS), Tablet, atau Laptop lain.

Ada **3 cara utama** yang bisa Anda gunakan tergantung pada kebutuhan Anda:

---

## 🛠️ Cara 1: Menggunakan Jaringan Wi-Fi yang Sama (Sangat Mudah & Gratis)
*Cocok untuk pengujian lokal di rumah, kantor, atau kampus di mana semua perangkat terhubung ke Wi-Fi/router yang sama.*

### Langkah 1: Cari IP Address Lokal (IPv4) Laptop Anda
Di laptop utama yang menjalankan project (Windows):
1. Buka **Command Prompt (cmd)** atau **PowerShell**.
2. Jalankan perintah berikut:
   ```bash
   ipconfig
   ```
3. Cari adaptor jaringan yang sedang Anda gunakan (biasanya bernama **Wireless LAN adapter Wi-Fi** atau **Ethernet adapter**).
4. Catat **IPv4 Address** Anda. Contohnya: `192.168.1.15`.

### Langkah 2: Jalankan Laravel Backend dengan Host IP Lokal
Agar backend Laravel menerima koneksi dari perangkat luar, jalankan serve dengan host `0.0.0.0` atau IP lokal Anda:
```bash
# Buka terminal di folder Backend/
php artisan serve --host=0.0.0.0 --port=8000
```
> **Info:** `--host=0.0.0.0` memerintahkan Laravel untuk mendengarkan koneksi dari semua alamat IP di jaringan Anda, bukan hanya `localhost`.

### Langkah 3: Sesuaikan Konfigurasi `.env` di Frontend
Ubah file `Frontend/.env` Anda agar mengarah ke IP lokal laptop Anda (bukan `localhost`):
```env
# Ganti localhost dengan IP lokal Anda (Langkah 1)
VITE_API_URL=http://192.168.1.15:8000/api
```

### Langkah 4: Jalankan Vite Frontend dengan Flag `--host`
Secara default, Vite hanya berjalan di `localhost`. Agar bisa diakses dari perangkat lain, jalankan dengan flag `--host`:
```bash
# Buka terminal di folder Frontend/
npm run dev -- --host
```
Setelah dijalankan, Vite akan menampilkan info seperti berikut di terminal:
```text
  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.1.15:5173/  <-- Gunakan URL Network ini!
```

### Langkah 5: Akses dari Device Lain
1. Pastikan HP atau tablet Anda terhubung ke **Wi-Fi yang sama** dengan laptop.
2. Buka browser di HP/tablet Anda.
3. Ketikkan URL Network di atas: `http://192.168.1.15:5173`.
4. 🎉 Selesai! Aplikasi Anda sekarang berjalan dan bisa diuji langsung dari layar sentuh HP Anda.

---

## 🌐 Cara 2: Menggunakan Layanan Tunneling (Akses Global dari Seluruh Dunia)
*Cocok jika Anda ingin mendemonstrasikan aplikasi ke klien/dosen yang berada di tempat berbeda (beda jaringan Wi-Fi, menggunakan paket data HP, dll) tanpa melakukan deploy permanen.*

Ada dua opsi gratis yang sangat praktis:

### Opsi A: Menggunakan Ngrok (Paling Populer & Stabil)
1. Download dan instal **Ngrok** dari [ngrok.com](https://ngrok.com) jika belum punya.
2. Hubungkan akun Ngrok Anda menggunakan token yang disediakan di dashboard Ngrok.
3. Karena project ini menggunakan arsitektur terpisah (Frontend & Backend), kita perlu membuka **2 tunnel**:

   * **Tunnel Backend (Laravel):**
     Jalankan Laravel secara normal (`php artisan serve`). Lalu buka terminal baru dan ketik:
     ```bash
     ngrok http 8000
     ```
     Ngrok akan memberikan URL HTTPS publik (contoh: `https://abcd-123-456.ngrok-free.app`). Catat URL ini.

   * **Update Frontend `.env`:**
     Ubah `Frontend/.env` Anda untuk menggunakan URL backend publik dari Ngrok:
     ```env
     VITE_API_URL=https://abcd-123-456.ngrok-free.app/api
     ```

   * **Tunnel Frontend (React/Vite):**
     Jalankan React secara normal (`npm run dev`). Lalu buka terminal baru lagi dan ketik:
     ```bash
     ngrok http 5173
     ```
     Ngrok akan memberikan URL HTTPS publik kedua (contoh: `https://xyz-987-654.ngrok-free.app`).

4. Bagikan/buka URL Frontend (`https://xyz-987-654.ngrok-free.app`) di HP atau device lain mana saja yang terkoneksi internet!

### Opsi B: Menggunakan Pinggy (Super Cepat, Tanpa Perlu Install Aplikasi)
Jika Anda menggunakan Windows 10/11, macOS, atau Linux, Anda sudah memiliki OpenSSH bawaan. Anda bisa memanfaatkan **Pinggy.io** secara gratis langsung dari terminal tanpa perlu mendownload aplikasi apa pun:

1. **Jalankan Laravel** seperti biasa (`php artisan serve` di port 8000).
2. **Buka Tunnel Backend:** Buka terminal baru dan jalankan:
   ```bash
   ssh -R 80:localhost:8000 a.pinggy.io
   ```
   Salin URL HTTPS yang dihasilkan di terminal (contoh: `https://rnldy-182-3-4.a.pinggy.io`).
3. **Ubah Frontend `.env`** menggunakan URL di atas:
   ```env
   VITE_API_URL=https://rnldy-182-3-4.a.pinggy.io/api
   ```
4. **Jalankan Vite** (`npm run dev` di port 5173).
5. **Buka Tunnel Frontend:** Buka terminal baru lagi dan jalankan:
   ```bash
   ssh -R 80:localhost:5173 a.pinggy.io
   ```
6. Buka URL HTTPS Frontend yang baru dihasilkan di HP Anda!

---

## 🚀 Cara 3: Langsung Deploy ke Production (Vercel & Zeabur)
*Ini adalah solusi terbaik, paling aman, permanen, dan profesional.*

Karena project Anda sudah memiliki file konfigurasi siap pakai:
- `Backend/zeabur.json` untuk deploy Laravel backend ke **Zeabur**.
- `Frontend/vercel.json` untuk deploy React frontend ke **Vercel**.

### Langkah-langkah:
1. **Deploy Backend (Laravel) ke Zeabur / Heroku / VPS**:
   - Dapatkan domain HTTPS production backend Anda, contoh: `https://todolist-mip.zeabur.app`.
2. **Deploy Frontend (React) ke Vercel**:
   - Hubungkan repositori GitHub Anda ke Vercel.
   - Pada bagian **Environment Variables** di dashboard Vercel, tambahkan variabel berikut:
     - **Key:** `VITE_API_URL`
     - **Value:** `https://todolist-mip.zeabur.app/api` (sesuaikan dengan URL backend asli Anda).
3. Vercel akan otomatis memberikan link domain HTTPS gratis yang sangat cepat (contoh: `https://todolist-mip.vercel.app`).
4. Link Vercel ini bisa diakses dari mana saja, kapan saja, dan di device apa saja dengan sangat lancar dan aman.

---

## 💡 Tips & Troubleshooting jika Tidak Bisa Terhubung:
* **Firewall Windows:** Jika menggunakan **Cara 1**, kadang Windows Defender Firewall memblokir koneksi masuk. Coba nonaktifkan sementara firewall untuk "Private Network" atau izinkan port `8000` dan `5173` melalui firewall.
* **Tipe Wi-Fi:** Beberapa Wi-Fi publik (seperti Wi-Fi kampus, kafe, atau hotspot tertentu) mengaktifkan fitur **AP Isolation** yang mencegah sesama perangkat terhubung saling berkomunikasi. Jika ini terjadi, gunakan **Tethering Hotspot dari HP** Anda sendiri atau gunakan **Cara 2 (Tunneling)**.
