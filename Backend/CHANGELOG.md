# Changelog — Backend To-Do List MIP

Riwayat perubahan dan perbaikan backend, diurutkan dari terbaru.

---

## [2026-05-06] Jadwal Shift & Kalender

### Fitur: Schedule Calendar (Admin)
- Halaman `/schedule-calendar` untuk admin mengatur jadwal shift intern 1 bulan penuh
- Tabel kalender: baris = intern, kolom = tanggal
- Klik cell untuk cycle shift: Morning → Afternoon → Cuti → OFF
- Modal "Atur Jadwal Bulanan" — pilih intern, set semua hari sekaligus, quick-fill buttons
- Shift type: `morning` (08:00–15:00), `afternoon` (15:00–22:00), `full`/Cuti

### Fitur: Jadwal Shift Intern
- Halaman `/my-schedule` untuk intern melihat jadwal shift bulanan
- Kalender grid dengan badge warna per shift
- Stats: total hari kerja, morning, afternoon, cuti
- Widget "Jadwal Shift Hari Ini" di dashboard intern terhubung ke data nyata

### Fix: Date Comparison Bug
- `new Date(shift_date)` menyebabkan timezone offset shift → jadwal tidak terbaca
- Diganti dengan `shift_date.substring(0, 10)` untuk string comparison yang reliable

---

## [2026-05-06] Evidence Lock & Image URL

### Fix: Evidence URL Relative → Full URL
- Backend menyimpan `/storage/...` (relative) → frontend tidak bisa load gambar
- Diubah ke `config('app.url') . Storage::url($path)` untuk full URL
- Migration script tersedia di `supabase_master_setup.sql` Bagian 6

### Fix: Evidence Lock Trigger Conflict
- Trigger `fn_lock_evidence_url()` memblokir re-upload (fitur keamanan, bukan bug)
- Ditambahkan pengecekan di application level sebelum hit database
- Pesan error yang lebih jelas untuk user

### Penjelasan Evidence Lock
- Intern hanya bisa upload foto bukti **satu kali** per tugas
- Setelah `evidence_url` terisi, kolom terkunci di level database
- Admin/superadmin bisa override jika ada kesalahan

---

## [2026-05-03] Assign Task Feature

### Fitur: Admin Assign Task ke Intern
- Endpoint `POST /api/daily-tasks/assign`
- Admin bisa assign tugas ke satu atau beberapa intern sekaligus
- Field baru: `assigned_by` (uuid FK) dan `assign_note` (text)
- Migration: `2026_05_03_021529_add_assign_fields_to_daily_tasks_table.php`

---

## [2026-05-01] Image Compression

### Fitur: Kompresi Gambar Bukti Tugas
- Install `intervention/image` v4.0.3
- Kompresi otomatis: JPEG 80%, max width 1920px
- Validasi upload: hanya JPEG/PNG/GIF/WEBP, max 10MB
- Field upload: `evidence_url` (bukan `photo`)

### Fix: Intervention Image v4 API
- Laravel 12 tidak support Facade untuk Intervention Image v4
- Ganti `Image::read()` → `$manager->decode()`
- Ganti `$image->toJpeg()` → `$image->encode(new JpegEncoder(quality: 80))`

---

## [2026-03-06] Initial Setup

### Setup Awal
- Laravel 12 + JWT Authentication (`php-open-source-saver/jwt-auth`)
- Database: PostgreSQL via Supabase (Session Pooler IPv4)
- Driver: `pdo_pgsql` — aktifkan di `php.ini`
- ERD v3: divisions, profiles, task_templates, daily_tasks, schedules, exceptions, whiteboards, broadcasts, notifications, audit_logs

---

## Catatan Teknis

### Koneksi Database
```env
DB_CONNECTION=pgsql
DB_HOST=aws-1-ap-southeast-1.pooler.supabase.com
DB_PORT=5432
DB_DATABASE=postgres
DB_SSLMODE=require
```

### Shift Types (nilai di database)
| Value | Label | Jam |
|-------|-------|-----|
| `morning` | Pagi | 08:00 – 15:00 |
| `afternoon` | Siang | 15:00 – 22:00 |
| `full` | Cuti | Hari Cuti |

### Status Daily Task
| Value | Kondisi |
|-------|---------|
| `pending` | Belum ada evidence = Belum Dikerjakan |
| `pending` | Ada evidence = Menunggu Review |
| `approved` | Disetujui admin |
| `rejected` | Ditolak, perlu revisi |
