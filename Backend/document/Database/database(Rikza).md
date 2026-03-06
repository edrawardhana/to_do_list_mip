# Sistem Database

Dokumentasi tentang database yang dipakai di project ini, disesuaikan dengan ERD terbaru.

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

## Penjelasan Teknis & Keputusan Desain

### 1. Kenapa Kolom "Enum" Terbaca Sebagai "Varchar" di Supabase?
Jika kamu melihat tabel di Supabase Dashboard (misalnya kolom `role` atau `shift` di tabel `profiles`), tipe datanya tertulis sebagai `varchar` dan bukan `enum`. 

**Alasan:**
Ini adalah cara bawaan (default) Laravel yang paling aman. Ketika kita mendefinisikan `$table->enum()` di file *migration* Laravel, Laravel membuat kolom tersebut bertipe `varchar` (string) namun di balik layar ia menambahkan sebuah **Aturan Batasan (CHECK Constraint)** di fungsionalitas PostgreSQL.

**Bukti:**
Walaupun bernama `varchar`, jika kamu mencoba memasukkan data di luar pilihan enum (misalnya mengisi role dengan tulisan `manager`), database Supabase akan langsung menolaknya dengan pesan error *violates check constraint*. Ini membuktikan bahwa pembatasan *(enum behavior)* berjalan 100% sempurna tanpa harus menggunakan custom type PostgreSQL yang rawan sulit diubah di masa depan.

### 2. Penggunaan UUID
Semua Primary Key (PK) dan Foreign Key (FK) di project ini menggunakan **UUID**. Hal ini memastikan keamanan data dan mempermudah penggabungan database tanpa takut terjadi bentrok ID (seperti yang sering terjadi pada tipe Auto-Increment integer).

### 3. Kenapa Pakai Pooler?
Supabase secara default menggunakan IPv6 untuk koneksi database langsung. Karena banyak *Internet Service Provider* (ISP) lokal di Indonesia hanya mendukung IPv4, kita **wajib** menggunakan Supabase Connection Pooler (`aws-1-ap-...`) sebagai `DB_HOST` agar koneksi tetap berjalan lancar dari komputer developer manapun.

---

## Struktur Tabel (Sesuai ERD Terbaru)

Semua tabel menggunakan **UUID** sebagai Primary Key.

### 1. `divisions`
Data departemen/divisi perusahaan.
| Tipe | Kolom | Keterangan |
|------|-------|------------|
| uuid | id | PK |
| string | name | Nama divisi (IT, Media, dll) |

### 2. `profiles`
Data user/staf (menggantikan tabel `users` lama).
| Tipe | Kolom | Keterangan |
|------|-------|------------|
| uuid | id | PK |
| uuid | division_id | FK ke divisions |
| string | full_name | Nama lengkap |
| string | email | Email (unik) |
| string | password_hash | Password yang sudah di-hash |
| enum | role | 'user', 'admin', 'super_admin', 'developer' (Varchar + Check Constraint) |
| enum | shift | 'pagi', 'middle', 'siang' (Varchar + Check Constraint) |
| boolean| is_locked | Fitur kunci akun (Default: false) |

### 3. `task_templates`
Template/jenis tugas rutin yang di-define berdasarkan divisi.
| Tipe | Kolom | Keterangan |
|------|-------|------------|
| uuid | id | PK |
| uuid | division_id | FK ke divisions |
| string | task_name | Nama tugas |

### 4. `whiteboards`
Penyimpanan aset, SOP, atau panduan per divisi.
| Tipe | Kolom | Keterangan |
|------|-------|------------|
| uuid | id | PK |
| uuid | division_id | FK ke divisions |
| string | title | Judul |
| text | content_url | URL menuju file/konten |
| enum | type | 'SOP', 'Tutorial', 'Asset' |

### 5. `daily_tasks`
Tugas harian yang di-submit oleh user (Profiles).
| Tipe | Kolom | Keterangan |
|------|-------|------------|
| uuid | id | PK |
| uuid | user_id | FK ke profiles (yang submit) |
| uuid | division_id | FK ke divisions |
| uuid | task_template_id | FK ke task_templates |
| string | task_name | Salinan nama tugas |
| string | evidence_url | Link bukti tugas |
| enum | status | 'pending', 'approved', 'rejected' |
| uuid | first_uploader_id| FK ke profiles (Null jika original) |
| timestamp| created_at | Waktu dibuat |

### 6. `attendance_schedules`
Pencatatan izin, sakit, libur, atau swap.
| Tipe | Kolom | Keterangan |
|------|-------|------------|
| uuid | id | PK |
| uuid | user_id | FK ke profiles |
| enum | type | 'Izin', 'Sakit', 'Swap', 'Libur' |
| date | start_date | Tanggal mulai |
| date | end_date | Tanggal selesai |
| string | proof_url | Nullable (bebas kosong jika Libur) |
| boolean| is_approved | Keputusan izin |

### 7. `audit_logs`
Sistem pencatatan riwayat (log) pergerakan dan aktivitas.
| Tipe | Kolom | Keterangan |
|------|-------|------------|
| uuid | id | PK |
| uuid | actor_id | FK ke profiles (pelaku) |
| uuid | target_id | FK (Universal ID ke item manapun) |
| string | action_type | Jenis tindakan |
| text | details | Penjelasan detail |
| timestamp| created_at | Waktu kejadian |

---

## Catatan Tambahan Penting

- **Dilarang keras memakai command `php artisan migrate:fresh`** karena akan menghapus seluruh data yang sudah ada di production/Supabase.
- Apabila ingin menambah kolom (*seperti kasus penambahan `password_hash` sebelumnya*), gunakan file *Migration* baru untuk mengelola perubahan (*contoh:* `php artisan make:migration add_kolom_baru_to_tabel`).
- File `.env` mengatur environment, untuk testing local gunakan `APP_ENV=local` dan `APP_DEBUG=true`, tapi koneksi *database* tetap mengarah ke pooler Supabase yang sama agar sinkron.
