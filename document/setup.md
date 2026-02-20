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

### 3. Buat File Environment

```bash
cp .env.example .env
```

### 4. Generate Application Key

```bash
php artisan key:generate
```

### 5. Konfigurasi Database (Supabase)

Buka file `.env` dan isi bagian database berikut:

```env
DB_CONNECTION=pgsql
DB_HOST=db.syvvhzdstzdcnehkzbik.supabase.co
DB_PORT=5432
DB_DATABASE=postgres
DB_USERNAME=postgres
DB_PASSWORD=isi_dengan_password_supabase
DB_SSLMODE=require
```

> Password Supabase bisa dilihat di: Supabase Dashboard > Settings > Database > Database password

### 6. Generate JWT Secret

```bash
php artisan jwt:secret
```

Perintah ini akan otomatis menambahkan `JWT_SECRET` ke file `.env`.

### 7. Jalankan Migration

```bash
php artisan migrate
```

Perintah ini akan membuat semua tabel yang dibutuhkan langsung di database Supabase.

### 8. Aktifkan Ekstensi PHP PostgreSQL

Pastikan ekstensi `pdo_pgsql` dan `pgsql` aktif di `php.ini`. Cari baris `extension_dir` lalu tambahkan:

```ini
extension=pgsql
extension=pdo_pgsql
```

### 9. Jalankan Server

```bash
php artisan serve
```

Server akan berjalan di `http://localhost:8000`.

---

## Catatan

- Jangan pernah menjalankan `php artisan migrate:fresh` karena akan menghapus semua data.
- File `.env` tidak ikut ter-commit ke Git karena sudah ada di `.gitignore`.
