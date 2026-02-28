# Setup Awal

Dokumentasi cara setup project Backend To-Do List MIP di lokal.

---

## Prasyarat

Pastikan sudah terinstall:

- PHP >= 8.2 (via XAMPP atau standalone)
- Composer
- Git

---

## Langkah Setup

### 1. Clone Repository

```bash
git clone https://github.com/edrawardhana/to_do_list_mip.git
cd to_do_list_mip/Backend
```

### 2. Install Dependencies

```bash
composer install
```

### 3. Konfigurasi ENV

Taruh file `.env` di folder `Backend/` (root backend). File ini sudah dikasih di group dan tidak ikut di-commit ke Git.

Isi penting di `.env`:

```env
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000

DB_CONNECTION=pgsql
DB_HOST=aws-1-ap-southeast-1.pooler.supabase.com
DB_PORT=5432
DB_DATABASE=postgres
DB_USERNAME=postgres.syvvhzdstzdcnehkzbik
DB_PASSWORD=[password dari group]
DB_SSLMODE=require
```

> Catatan: `DB_HOST` wajib pakai alamat pooler (`aws-1-...`), jangan pakai alamat direct supaya bisa connect dari IPv4.

### 4. Jalankan Server

```bash
php artisan serve
```

Server akan berjalan di `http://localhost:8000`.

---

## Catatan Penting

- **Jangan pernah** jalankan `php artisan migrate:fresh` karena akan menghapus semua data di Supabase.
- File `.env` tidak ikut ter-commit ke Git.
- Kalau mau tambah tabel/kolom baru, pakai `php artisan make:migration` lalu `php artisan migrate`.

---

## Deployment (Zeabur)

Backend sudah di-deploy ke Zeabur di URL:

```
https://todolist-mip.zeabur.app
```

Konfigurasi deployment ada di file `zeabur.json` dan `Dockerfile` di root Backend. Env variabel di Zeabur diatur langsung di dashboard Zeabur.
