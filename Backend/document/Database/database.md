# Database — To-Do List MIP

Dokumentasi lengkap database Supabase/PostgreSQL untuk project ini.

---

## Koneksi

| Komponen   | Detail |
|------------|--------|
| Provider   | Supabase |
| Engine     | PostgreSQL |
| Driver PHP | `pdo_pgsql` |
| Host       | `aws-1-ap-southeast-1.pooler.supabase.com` (Session Pooler IPv4) |
| Port       | `5432` |
| Database   | `postgres` |

> **Kenapa pakai Pooler?** ISP lokal Indonesia umumnya hanya mendukung IPv4. Supabase direct connection menggunakan IPv6, sehingga wajib pakai alamat pooler agar bisa connect dari mana saja.

---

## Setup

Semua SQL ada di satu file: **`supabase_master_setup.sql`**

Jalankan di Supabase SQL Editor secara berurutan:

| Bagian | Isi |
|--------|-----|
| 1 | Schema & Tabel |
| 2 | Storage Bucket (`task_evidence`) |
| 3 | Row Level Security (RLS) |
| 4 | Triggers |
| 5 | Cron Jobs (pg_cron) |
| 6 | Migration Utilities (opsional) |

---

## Struktur Tabel

Semua tabel menggunakan **UUID** sebagai Primary Key.

### `divisions`
Divisi/departemen perusahaan.

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | uuid PK | |
| name | varchar | Nama divisi (IT, Media, dll) |
| description | text | |

### `profiles`
Data user — menggantikan tabel `users` Laravel default.

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | uuid PK | |
| full_name | varchar | |
| nickname | varchar | |
| email | varchar UNIQUE | |
| username | varchar UNIQUE | |
| password_hash | text | Hash Bcrypt dari Laravel |
| division_id | uuid FK | → divisions |
| role | varchar | `intern` / `admin` / `super_admin` / `developer` |
| is_verified | boolean | Default false |
| is_locked | boolean | Default false — dikontrol cron & trigger |
| avatar_url | text | |
| phone_number | varchar | |
| fcm_token | text | Push notification token |
| deleted_at | timestamptz | Soft delete |

### `task_templates`
Template tugas rutin per divisi.

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | uuid PK | |
| division_id | uuid FK | → divisions |
| title | varchar | Nama tugas |
| description | text | |
| is_active | boolean | Jika false, tidak di-generate |

### `daily_tasks`
Logbook tugas harian intern.

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | uuid PK | |
| uploader_id | uuid FK | → profiles (intern) |
| division_id | uuid FK | → divisions |
| template_id | uuid FK | → task_templates |
| task_date | date | |
| description | text | Catatan tambahan |
| status | varchar | `pending` / `approved` / `rejected` / `revision` |
| evidence_url | text | **Terkunci setelah diisi** (lihat trigger) |
| confirmed_participants | jsonb | Array user_id peserta |
| evaluated_by | uuid FK | → profiles (admin yang review) |
| reject_reason | text | |
| assign_note | text | Catatan dari admin saat assign |
| assigned_by | uuid FK | → profiles (admin yang assign) |

### `schedules`
Jadwal shift intern per hari.

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | uuid PK | |
| user_id | uuid FK | → profiles |
| shift_date | date | |
| shift_type | varchar | `morning` / `afternoon` / `full` |

> Constraint `UNIQUE(user_id, shift_date)` mencegah 1 intern punya 2 shift di hari yang sama.

### `exceptions`
Pengajuan izin, sakit, tugas luar, atau swap shift.

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | uuid PK | |
| user_id | uuid FK | → profiles |
| evaluated_by | uuid FK | → profiles (admin) |
| permission_date | date | Tanggal izin berlaku |
| replacement_date | date | Tanggal pengganti (untuk swap) |
| type | varchar | `sakit` / `izin` / `tugas_luar` / `swap_shift` |
| status | varchar | `pending` / `approved` / `rejected` |

### `whiteboards`
Pengumuman, SOP, dan aset per divisi.

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | uuid PK | |
| division_id | uuid FK | → divisions |
| title | varchar | |
| file_url | text | |
| type | varchar | `pdf` / `image` / `link` |

### `broadcasts`
Pengumuman global dari superadmin.

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | uuid PK | |
| author_id | uuid FK | → profiles |
| title | varchar | |
| content | text | |
| category | varchar | `info` / `urgent` |
| expires_at | timestamptz | |

### `notifications`
Notifikasi personal per user.

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | uuid PK | |
| user_id | uuid FK | → profiles |
| title | varchar | |
| message | text | |
| type | varchar | `info` / `warning` / `success` / `danger` |
| is_read | boolean | |

### `audit_logs`
Log aktivitas admin — **permanen, tidak bisa dihapus/diubah**.

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | uuid PK | |
| admin_id | uuid FK | → profiles |
| actor_role | varchar | |
| action | text | Deskripsi aksi |
| old_values | jsonb | Data sebelum diubah |
| new_values | jsonb | Data setelah diubah |
| target_user_id | uuid FK | → profiles |

---

## Row Level Security (RLS)

RLS memastikan isolasi data antar divisi di level database — bahkan jika ada bug di backend/frontend, data tetap aman.

| Role | Akses |
|------|-------|
| `intern` | Hanya data milik sendiri |
| `admin` | Semua data dalam divisinya |
| `super_admin` | Semua data tanpa batas |
| `developer` | Sama seperti super_admin + system_configs |

> **Catatan:** RLS hanya berlaku untuk akses via Supabase SDK (anon/authenticated key). Koneksi dari Laravel via `.env` DB credentials menggunakan service role dan **tidak terkena RLS**.

---

## Triggers

### 1. `trigger_lock_evidence` — Evidence Lock
Intern tidak bisa mengganti `evidence_url` setelah foto pertama diupload. Hanya admin/superadmin yang bisa override.

```
Intern upload foto → evidence_url terisi → TERKUNCI
Intern coba upload lagi → RAISE EXCEPTION '[LOCK] evidence_url sudah terkunci...'
Admin/Superadmin → boleh override
```

### 2. `trigger_lock_on_exception` — Auto-lock saat izin
Ketika admin menyetujui izin/sakit untuk hari ini, akun intern otomatis dikunci. Jika izin dibatalkan, akun dibuka kembali.

### 3. `trigger_ghost_audit_no_delete` & `trigger_ghost_audit_no_update`
Audit log bersifat immutable — tidak bisa dihapus atau diubah oleh siapapun melalui aplikasi.

### 4. `trg_auto_update_profiles` & `trg_auto_update_daily_tasks`
Auto-update kolom `updated_at` setiap kali ada perubahan data.

---

## Cron Jobs (pg_cron)

Semua waktu dalam **UTC**. WIB = UTC+7, jadi WIB − 7 = UTC.

| Job | Jadwal (UTC) | Jadwal (WIB) | Fungsi |
|-----|-------------|-------------|--------|
| `auto-lock-daily` | `30 14 * * *` | 21:30 | Kunci semua akun intern |
| `auto-unlock-daily` | `30 0 * * *` | 07:30 | Buka akun intern (kecuali yang izin/sakit) |
| `generate-daily-tasks` | `0 17 * * *` | 00:00 | Generate tugas harian dari template |

### Logika generate-daily-tasks
- Ambil semua intern yang punya divisi
- Cocokkan dengan `task_templates` aktif di divisinya
- Insert ke `daily_tasks` dengan status `pending`
- Skip intern yang punya izin/sakit disetujui hari itu
- Skip jika tugas untuk template + tanggal yang sama sudah ada (idempotent)

---

## Storage

Bucket `task_evidence` di Supabase Storage menyimpan foto bukti tugas.

- **Public read** — URL foto bisa langsung dipakai di `<img>`
- **Authenticated upload** — hanya user yang login
- **Delete** — hanya pemilik file atau superadmin

URL format: `{APP_URL}/storage/task_evidence/{filename}`

---

## Catatan Penting

- **Jangan jalankan `php artisan migrate:fresh`** — akan menghapus semua data di Supabase.
- Untuk menambah kolom, gunakan `php artisan make:migration` lalu `php artisan migrate`.
- Kolom enum di Supabase tampil sebagai `varchar` dengan CHECK constraint — ini normal dan aman.
- Untuk bypass trigger saat migration darurat, gunakan `SET session_replication_role = replica` dalam transaction (lihat Bagian 6 di `supabase_master_setup.sql`).
