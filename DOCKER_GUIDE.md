# Panduan Instalasi dan Deployment dengan Docker

Dokumen ini menjelaskan langkah-langkah untuk memasang (install) dan menjalankan aplikasi **To-Do List MIP** secara kontainer (menggunakan Docker) di PC lokal maupun di PC Server lain dalam satu jaringan lokal.

---

## 📋 Prasyarat Sistem
Sebelum memulai, pastikan PC Server atau target instalasi sudah terpasang software berikut:
1. **Docker Desktop** (untuk Windows/macOS) atau **Docker Engine + Compose** (untuk Linux).
2. **Git** (untuk mendownload repositori dari GitHub).

---

## 🚀 Langkah-langkah Instalasi

### 1. Clone Repositori
Jalankan perintah ini di terminal/command prompt PC server untuk menyalin source code:
```bash
git clone <URL_REPOSITORI_ANDA>
cd to_do_list_mip
```

### 2. Konfigurasi Alamat IP (Opsional)
Jika Anda men-deploy ke PC Server agar bisa diakses oleh PC/HP lain dalam jaringan lokal, Anda perlu memperbarui IP Address server tersebut di file `docker-compose.yml` di direktori root.

Buka file `docker-compose.yml`, lalu cari bagian berikut dan sesuaikan dengan IP PC Server Anda:
```yaml
# Contoh menggunakan IP Server: 10.10.20.5
backend:
  environment:
    ...
    APP_URL: http://10.10.20.5:8005
    FRONTEND_URL: http://10.10.20.5:8080,http://localhost:8080

frontend:
  build:
    args:
      - VITE_API_URL=http://10.10.20.5:8005/api
```
*(Catatan: Jika hanya untuk dicoba secara offline di PC yang sama, gunakan `localhost` atau biarkan default)*.

### 3. Build & Jalankan Container
Jalankan perintah berikut di root folder project untuk membangun image dan menjalankan service database lokal, backend, serta frontend:
```bash
docker compose up --build -d
```
Tunggu hingga proses build selesai. Jika sukses, status container akan menjadi `Started`.

### 4. Seed Database (Mengisi Akun Awal)
Setelah semua container berjalan, Anda wajib mengisi data awal database (seperti akun administrator default, divisi, dan template tugas). Jalankan perintah berikut:
```bash
docker compose exec backend php artisan db:seed
```

Setelah berhasil dijalankan, database lokal Anda akan memiliki akun bawaan sebagai berikut:

* **Super Admin**:
  * **Email**: `superadmin@mcc.com`
  * **Password**: `password123`
* **Admin IT**:
  * **Email**: `admin@mcc.com`
  * **Password**: `password123`
* **Intern Testing**:
  * **Email**: `intern@mcc.com`
  * **Password**: `password123`

---

## 💻 Cara Mengakses Aplikasi
Buka web browser dan akses alamat berikut:
* **Akses Frontend (Aplikasi Utama)**: `http://<IP_SERVER_ANDA>:8080` (Contoh: `http://10.10.20.5:8080` atau `http://localhost:8080`).
* **Akses Backend API**: `http://<IP_SERVER_ANDA>:8005/api` (Contoh: `http://10.10.20.5:8005/api` atau `http://localhost:8005/api`).

---

## ⚙️ Perintah Manajemen Docker Compose

* **Menghentikan Container**:
  ```bash
  docker compose down
  ```
* **Melihat Log secara Real-time**:
  ```bash
  docker compose logs -f
  ```
* **Melihat Status Container**:
  ```bash
  docker compose ps
  ```
* **Reset Database (Menghapus Semua Data & Mulai dari Awal)**:
  ```bash
  docker compose down -v
  ```
