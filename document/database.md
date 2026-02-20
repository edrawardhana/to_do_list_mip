# Sistem Database

Dokumentasi ini menjelaskan sistem database yang digunakan beserta alur pengelolaan tabel dan data.

---

## Teknologi

| Komponen    | Detail                          |
|-------------|---------------------------------|
| Provider    | Supabase                        |
| Engine      | PostgreSQL 17.6                 |
| Driver PHP  | pdo_pgsql                       |
| Koneksi     | SSL (sslmode=require)           |
| Host        | db.syvvhzdstzdcnehkzbik.supabase.co |

---

## Konfigurasi Koneksi

Konfigurasi database disimpan di file `.env`:

```env
DB_CONNECTION=pgsql
DB_HOST=db.syvvhzdstzdcnehkzbik.supabase.co
DB_PORT=5432
DB_DATABASE=postgres
DB_USERNAME=postgres
DB_PASSWORD=...
DB_SSLMODE=require
```

Driver yang digunakan di `config/database.php` adalah `pgsql`.

---

## Tabel yang Ada

| Tabel               | Keterangan                              |
|---------------------|-----------------------------------------|
| users               | Data akun pengguna                      |
| migrations          | Riwayat migration yang sudah dijalankan |
| cache               | Data cache aplikasi                     |
| cache_locks         | Lock mekanisme untuk cache              |
| sessions            | Data sesi pengguna                      |
| jobs                | Antrian job background                  |
| job_batches         | Batch antrian job                       |
| failed_jobs         | Job yang gagal dijalankan               |
| password_reset_tokens | Token untuk reset password            |

---

## Cara Menambah Tabel Baru

### 1. Buat file migration

```bash
php artisan make:migration create_nama_tabel_table
```

File migration akan dibuat di folder `database/migrations/`.

### 2. Edit file migration

Contoh:

```php
public function up(): void
{
    Schema::create('todos', function (Blueprint $table) {
        $table->id();
        $table->foreignId('user_id')->constrained()->cascadeOnDelete();
        $table->string('title');
        $table->boolean('is_done')->default(false);
        $table->timestamps();
    });
}

public function down(): void
{
    Schema::dropIfExists('todos');
}
```

### 3. Jalankan migration

```bash
php artisan migrate
```

Tabel akan otomatis dibuat di database Supabase.

---

## Cara Mengubah Kolom yang Sudah Ada

Buat migration baru, jangan ubah file migration lama:

```bash
php artisan make:migration add_kolom_baru_to_nama_tabel_table
```

Contoh isi migration:

```php
public function up(): void
{
    Schema::table('todos', function (Blueprint $table) {
        $table->text('description')->nullable()->after('title');
    });
}

public function down(): void
{
    Schema::table('todos', function (Blueprint $table) {
        $table->dropColumn('description');
    });
}
```

---

## Aturan Penting

- **Dilarang** menggunakan `php artisan migrate:fresh` karena akan menghapus semua data.
- Selalu buat **migration baru** untuk perubahan skema, jangan edit migration lama yang sudah pernah dijalankan.
- Gunakan `php artisan migrate:status` untuk melihat status migration yang sudah dijalankan.

---

## Perintah Berguna

| Perintah                        | Fungsi                                  |
|---------------------------------|-----------------------------------------|
| `php artisan migrate`           | Jalankan migration yang belum dijalankan |
| `php artisan migrate:status`    | Lihat status semua migration            |
| `php artisan migrate:rollback`  | Batalkan migration terakhir             |
| `php artisan make:migration`    | Buat file migration baru                |
| `php artisan make:model`        | Buat model Eloquent baru                |
