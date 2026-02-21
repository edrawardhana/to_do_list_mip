# Setup Awal

Dokumentasi ini menjelaskan cara melakukan setup awal project Backend To-Do List MIP.

---

## Prasyarat

Sebelum memulai, pastikan sudah terinstall:

- PHP >= 8.2 (via XAMPP atau standalone)
- Composer
- Git

---

## Langkah Setup

### 1. Clone Repository

```bash
git clone https://github.com/edrawardhana/to_do_list_mip.git
cd to_do_list_mip/Backend_To_Do_List
```

### 2. Install Dependencies

```bash
composer install
```

### 3. ENV

Taruh env di folder root, yang sudah di kasih di group

### 4. Jalankan Server

```bash
php artisan serve
```

Server akan berjalan di `http://localhost:8000`.

---

---

## IP Whitelisting (Keamanan WiFi)

Untuk membatasi akses API hanya dari WiFi tertentu (misal WiFi kantor MCC), project ini menggunakan middleware `RestrictIpMiddleware`.

### Cara Menambah IP yang Diizinkan:
1. Buka file `.env`.
2. Cari variabel `ALLOWED_IPS`.
3. Tambahkan IP Public WiFi kantor, pisahkan dengan koma (tanpa spasi).
   Contoh: `ALLOWED_IPS=127.0.0.1,180.248.38.40,IP_LAINNYA`

> **Tips:** Kamu bisa cek IP Public yang sedang kamu gunakan dengan mengetik `curl ifconfig.me` di terminal atau buka website `whatismyip.com`.

---

## Catatan
- Jangan pernah menjalankan `php artisan migrate:fresh` karena akan menghapus semua data.
- File `.env` tidak ikut ter-commit ke Git karena sudah ada di `.gitignore`.
- Jika IP kantor berubah (Dinamis), kamu harus mengupdate `ALLOWED_IPS` di `.env` agar tetap bisa mengakses API.
