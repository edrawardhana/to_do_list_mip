# Dokumentasi Endpoint Backend API Utama

Semua endpoint di bawah ini WAJIB menggunakan Header `Authorization: Bearer <token>` (didapat dari Login).

## 1. Absensi (Attendance)
Perlu dicatat: Absensi di sistem ini BUKAN aplikasi check-in harian (clock in/out), MELAINKAN fitur pengajuan Cuti, Izin, Sakit, atau Tukar Shift (Swap) berdurasi berhari-hari.

### A. Lihat Riwayat Pengajuan
`GET /api/attendance`
- **User:** Hanya akan melihat riwayat pengajuannya sendiri.
- **Admin:** Hanya akan melihat riwayat pengajuan anggota divisinya.
- Bisa mengirim query string `?type=Izin` untuk memfilter.

### B. Ajukan Permohonan (User)
`POST /api/attendance`
**Body JSON:**
```json
{
  "type": "Izin", 
  "start_date": "2026-10-14",
  "end_date": "2026-10-16",
  "proof_url": "https://{kode-project}.supabase.co/storage/v1/object/public/...jpg"
}
```
*(Tipe yang diizinkan: `Izin`, `Sakit`, `Swap`, `Libur`)*

### C. Setujui / Tolak Permohonan (Khusus Admin)
`PUT /api/attendance/{id}`
- **Body JSON:** `{"is_approved": true}` 
- Pengajuan yang tipenya `Izin` atau `Sakit` secara otomatis (lewat Database Trigger) akan **Mengunci** akun user tersebut, begitupun sebaliknya.

---

## 2. Papan Pengumuman (Whiteboards)
Berbagi pengumuman, materi, atau aset yang HANYA bisa dilihat oleh anggota divisi yang sama.

### A. Lihat Pengumuman Divisi
`GET /api/whiteboards`
- Otomatis memfilter hasil (RLS Lapisan 2) yang sesuai dengan ID Divisi user.

### B. Tambah Pengumuman Baru (Khusus Admin)
`POST /api/whiteboards`
- **Body JSON:**
```json
{
  "title": "SOP Penggunaan AI",
  "content_url": "https://google.com/drive/xxx",
  "type": "SOP"
}
```
*(Tipe yang diizinkan: `SOP`, `Tutorial`, `Asset`)*
- Admin akan selalu memposting ke divisinya sendiri. `super_admin` bisa menspesifikasikan kolom `division_id`.

---

## 3. Logbook Laporan (Daily Tasks)
Catatan: Logbook harian karyawan ini di-*generate* otomatis setiap jam 00:00 WIB oleh sistem Supabase. Karyawan hanya perlu mengedit dan melengkapinya setiap hari.

### A. Lihat Daftar Tugas
`GET /api/daily-tasks`

### B. Edit Tugas / Upload Bukti (User)
`PUT /api/daily-tasks/{id}`
- **Body JSON:**
```json
{
  "evidence_url": "https://{kode}.supabase.co/storage/v1/object/public/...jpg",
  "confirmed_participants": ["uuid_karyawan_a", "uuid_karyawan_b"]
}
```
**[!! PENTING - TRIGGER PENYEGELAN FOTO !!]**
Jika `evidence_url` ini **SUDAH PERNAH TERISI** pada upload-an pertama user, dan user mengirim request `PUT` untuk mengubahnya lagi, Supabase akan menolak proses `UPDATE` ini demi Integritas Data.
- Laravel akan mengembalikan Respons **Status 403** (Forbidden).
- **Pesan:** `"Bukti foto sudah dikunci permanen oleh sistem dan tidak dapat diubah lagi. Hubungi Admin Jika ada keliruan."`

### C. Setujui Tugas (Admin)
`PUT /api/daily-tasks/{id}`
- Admin mengubah `"status": "approved"` atau `"rejected"`. Status bawaan adalah `pending`. Karyawan biasa akan ditolak jika mencoba mengubah statusnya menjadi `approved`.

---

## 4. Templat Tugas Harian (Khusus Admin/Superadmin)
Mengatur daftar tugas *default* yang akan ditarik oleh Cron Job setiap jam 00:00 untuk dimasukkan otomatis ke logbook karyawan divisi tersebut.

### A. Lihat Daftar Templat
`GET /api/task-templates`

### B. Buat Templat Baru
`POST /api/task-templates`
- **Body JSON:** `{"task_name": "Review PR dari Frontend"}`
- `super_admin` wajib menyertakan `{"division_id": "..."}`. Admin biasa otomatis ter-assign ke divisinya.

### C. Update / Hapus Templat
- `PUT /api/task-templates/{id}`
- `DELETE /api/task-templates/{id}`

---

## 5. Audit Log (Khusus Admin/Superadmin)
Melihat riwayat aktivitas di dalam sistem.
`GET /api/audit-logs`
- User biasa ditolak (Status 403). Admin hanya diperlihatkan *log* yang melibatkan user dari divisinya sendiri.

---

## 6. Manajemen Karyawan / Profil
Penting untuk mengambil UUID Karyawan (untuk fitur *Participant Tagging*) dan untuk Admin mengelola bawahannya.

### A. Lihat Daftar Karyawan
`GET /api/profiles`
- Mengembalikan daftar UUID, Nama, Email, Shift, Divisi, dan Status `is_locked`.
- User biasa hanya akan melihat karyawan lain di divisi yang sama.

### B. Kelola Karyawan (Khusus Admin/Superadmin)
`PUT /api/profiles/{id}`
- **Body JSON:** `{"is_locked": false, "shift": "pagi", "role": "user"}`
- Ini adalah endpoint kritikal bagi Admin/HRD untuk meresmikan akun pegawai baru (mengubah `is_locked` dari `true` ke `false`) dan memberikannya `shift`.
