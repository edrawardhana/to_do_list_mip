# Sistem Database

Dokumentasi tentang database yang dipakai di project ini.

---

## Teknologi

| Komponen    | Detail                          |
|-------------|---------------------------------|
| Provider    | Supabase                        |
| Engine      | PostgreSQL                      |
| Driver PHP  | `pdo_pgsql`                     |
| Koneksi     | Session Pooler (IPv4)           |
| Host        | `aws-1-ap-southeast-1.pooler.supabase.com` |
| Port        | `5432`                          |

---

## Kenapa Pakai Pooler?

Supabase defaultnya pakai IPv6 untuk koneksi langsung, tapi kebanyakan ISP lokal cuma support IPv4. Makanya kita wajib pakai **Supabase Connection Pooler** supaya tetap bisa connect.

Jadi pastikan `DB_HOST` di `.env` selalu pakai alamat pooler (`aws-1-...`), **bukan** alamat direct (`db.syvvh...`).

---

## Struktur Tabel

Semua tabel pakai **UUID** sebagai Primary Key.

### 1. `divisions`
Menyimpan data divisi (IT, Media, Marketing, dll).

| Tipe | Kolom | Keterangan |
|------|-------|------------|
| uuid | id | PK |
| string | name | Nama divisi |
| string | description | Deskripsi divisi |

### 2. `users`
Data semua user (Intern, Admin, SuperAdmin).

| Tipe | Kolom | Keterangan |
|------|-------|------------|
| uuid | id | PK |
| string | full_name | Nama lengkap |
| string | email | Email (unik) |
| string | password_hash | Password yang sudah di-hash |
| string | role | Intern, Admin, atau SuperAdmin |
| uuid | division_id | FK ke divisions |
| string | shift_type | Morning atau Afternoon |
| boolean | is_locked | Fitur kunci akun |
| string | status | Pending, Active, atau Finished |
| timestamp | created_at | Waktu dibuat |

### 3. `tasks_master`
Template tugas rutin per divisi. Admin yang define, nanti di-assign ke user.

| Tipe | Kolom | Keterangan |
|------|-------|------------|
| uuid | id | PK |
| uuid | division_id | FK ke divisions |
| string | task_name | Nama tugas |
| string | description | Deskripsi tugas |

### 4. `whiteboard`
Konten whiteboard per divisi (Setup VR, Digisign, dll).

| Tipe | Kolom | Keterangan |
|------|-------|------------|
| uuid | id | PK |
| string | title | Judul |
| text | content | Isi konten |
| string | category | Kategori (Setup VR, Digisign, dll) |
| uuid | division_id | FK ke divisions |
| uuid | created_by | FK ke users (siapa yang buat) |
| timestamp | updated_at | Terakhir diupdate |

### 5. `logbook_entries`
Log kegiatan harian user. Setiap user submit logbook tiap hari.

| Tipe | Kolom | Keterangan |
|------|-------|------------|
| uuid | id | PK |
| uuid | user_id | FK ke users |
| uuid | task_id | FK ke tasks_master |
| boolean | is_completed | Sudah selesai atau belum |
| timestamp | completed_at | Waktu selesai |
| string | proof_image_url | URL bukti foto (metadata validated) |

### 6. `shift_swaps`
Request tukar shift antar user.

| Tipe | Kolom | Keterangan |
|------|-------|------------|
| uuid | id | PK |
| uuid | requester_id | FK ke users (yang minta tukar) |
| uuid | target_user_id | FK ke users (target tukar) |
| date | swap_date | Tanggal tukar shift |
| string | reason_screenshot_url | URL screenshot alasan |
| string | status | Pending, Approved, atau Rejected |
| uuid | approved_by | FK ke users (admin yang approve) |

### 7. `broadcasts`
Pengumuman dari admin ke divisi tertentu atau ke semua orang.

| Tipe | Kolom | Keterangan |
|------|-------|------------|
| uuid | id | PK |
| uuid | admin_id | FK ke users (admin yang kirim) |
| uuid | target_division_id | FK ke divisions (null = global) |
| text | message | Isi pengumuman |
| timestamp | created_at | Waktu dibuat |

---

## Relasi Antar Tabel

- Satu **division** punya banyak **users** dan banyak **tasks_master**
- Satu **user** bisa punya banyak **logbook_entries** dan bisa request banyak **shift_swaps**
- **Broadcasts** dikirim oleh admin, bisa ditargetkan ke divisi tertentu atau global (null)
- **Whiteboard** dibuat oleh user dan dikategorikan per divisi

---

## Troubleshooting

Kalau muncul error `SQLSTATE[08006] could not translate host name...`:
- Pastikan `DB_HOST` di `.env` pakai alamat pooler (`aws-1-ap-...`)
- Coba ganti DNS PC ke Google DNS (8.8.8.8)

---

## Catatan

- **Jangan** jalankan `php artisan migrate:fresh` karena bakal menghapus semua data.
- Kalau mau tambah tabel baru, pakai `php artisan make:migration`.
- Semua perubahan schema lewat Laravel Migrations, jangan edit langsung di Supabase.
