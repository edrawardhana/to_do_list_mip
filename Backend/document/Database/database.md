# Sistem Database

Dokumentasi ini menjelaskan sistem database yang digunakan, tabel-tabel yang ada, serta konfigurasi koneksi ke Supabase.

---

## Teknologi

| Komponen    | Detail                          |
|-------------|---------------------------------|
| Provider    | Supabase                        |
| Engine      | PostgreSQL 17.6                 |
| Driver PHP  | `pdo_pgsql`                     |
| Koneksi     | **Session Pooler** (IPv4 Supported) |
| Host        | `aws-1-ap-southeast-1.pooler.supabase.com` |
| Port        | `5432` (Session Mode)           |

---

## Konfigurasi Koneksi Penting

Karena Supabase menggunakan IPv6 untuk *Direct Connection*, sedangkan banyak ISP (termasuk di lokal) hanya mendukung IPv4, kita **wajib** menggunakan **Supabase Connection Pooler**.

**Konfigurasi `.env` yang Benar:**

```env
DB_CONNECTION=pgsql
DB_HOST=aws-1-ap-southeast-1.pooler.supabase.com
DB_PORT=5432
DB_DATABASE=postgres
DB_USERNAME=postgres.syvvhzdstzdcnehkzbik
DB_PASSWORD=[password_kamu]
DB_SSLMODE=require
```

> **Catatan:** Jangan gunakan host `db.syvvhzdstzdcnehkzbik.supabase.co` kecuali jaringanmu support full IPv6. Gunakan host pooler `aws-1-...` seperti di atas.

---

## Struktur Tabel (Schema)

Berikut adalah daftar tabel utama dalam aplikasi To-Do List & Daily Report ini:

### 1. `shifts`
Menyimpan data shift kerja (A, B, C).
- `id` (PK)
- `nama_shift` (String: "A", "B", "C")

### 2. `users`
Menyimpan data pegawai dan admin.
- `id` (PK)
- `shift_id` (FK -> `shifts.id`)
- `name` (String: default Laravel)
- `nama_lengkap` (String: nama lengkap pegawai)
- `username` (String: unik)
- `email` (String: unik, untuk login)
- `password` (String: hashed)
- `role` (Enum: 'admin', 'pegawai')

### 3. `master_templates`
Menyimpan daftar tugas rutin yang "di-saved" oleh admin untuk setiap shift. Data ini akan disalin ke `daily_tasks` setiap hari.
- `id` (PK)
- `shift_id` (FK -> `shifts.id`)
- `nama_kegiatan` (String: nama tugas rutin)
- `estimasi_waktu` (Time: perkiraan durasi)

### 4. `daily_tasks`
Menyimpan tugas harian untuk setiap user pada tanggal tertentu.
- `id` (PK)
- `user_id` (FK -> `users.id`)
- `tanggal` (Date)
- `nama_kegiatan` (String)
- `waktu_checklist` (Time: kapan user mengerjakan/conteng)
- `status` (Enum: 'pending', 'selesai')
- `catatan` (Text: opsional)

### 5. `off_schedules`
Menyimpan jadwal libur pegawai. Digunakan untuk menandai "OFF" di laporan harian.
- `id` (PK)
- `user_id` (FK -> `users.id`)
- `tanggal_off` (Date)

---

## Relasi & Alur Data

1.  **Shift & Tugas Rutin**: Setiap `shift` memiliki banyak `master_templates`. Pegawai di shift tersebut akan mendapatkan tugas rutin ini.
2.  **User & Shift**: Setiap `user` (pegawai) terhubung ke satu `shift`.
3.  **Generasi Tugas Harian**: (Logic di Backend) Saat user login/hari berganti, sistem mengambil tugas dari `master_templates` sesuai shift user, lalu menyalinnya ke `daily_tasks`.
4.  **Laporan**: Laporan harian mengambil data dari `daily_tasks`. Jika tanggal tersebut ada di `off_schedules` untuk user tersebut, laporan akan menampilkan status "OFF".

---

## Manajemen Database (Migration)

Semua perubahan struktur tabel dilakukan melalui Laravel Migrations.

### Membuat Tabel Baru
```bash
php artisan make:migration create_nama_tabel_table
```

### Mengubah Tabel (Tambah Kolom)
```bash
php artisan make:migration add_kolom_baru_to_nama_tabel_table
```

### Menjalankan Perubahan ke Supabase
```bash
php artisan migrate
```

> **PERINGATAN KERAS:** Jangan pernah menjalan `php artisan migrate:fresh` karena akan **MENGHAPUS SELURUH DATA** di Supabase.

---

## Troubleshooting

Jika muncul error: `SQLSTATE[08006] [7] could not translate host name...`
- **Penyebab**: DNS tidak bisa connect ke host Supabase.
- **Solusi**: Pastikan `DB_HOST` di `.env` menggunakan alamat pooler (`aws-1-ap-...`) dan **bukan** alamat direct (`db.syvvh...`). Ganti DNS PC ke Google DNS (8.8.8.8) jika masih bermasalah.
