# Dokumentasi API Backend (To-Do List MIP)

Dokumen ini merangkum semua Endpoint API Laravel yang dipanggil oleh sistem Frontend (React + Vite) di aplikasi To-Do List MIP.

## 📌 Base URL & Headers
- **Base URL (Local):** `http://localhost:8000/api`
- **Base URL (Production):** Sesuai domain deployment Zeabur/Vercel (misal: `https://todolist-mip.zeabur.app/api`)
- **Headers Default:**
  ```json
  {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "Authorization": "Bearer <TOKEN_JWT_DARI_LOCALSTORAGE>"
  }
  ```
*(Sebagian besar endpoint dilindungi oleh Middleware Autentikasi Laravel & JWT)*

---

## 1. 👥 Profiles & Akun (Users)
Mengelola data pengguna, intern, admin, dan superadmin.

### `GET /api/profiles`
- **Fungsi:** Mengambil daftar seluruh pengguna.
- **Hak Akses:** Admin, Superadmin, Developer.

### `PUT /api/profiles/{id}/role`
- **Fungsi:** Mengubah role/kasta pengguna (Promote/Demote).
- **Payload:**
  ```json
  { "role": "user" | "admin" | "super_admin" }
  ```

### `PUT /api/profiles/{id}/verify`
- **Fungsi:** Memverifikasi pendaftaran anak magang (ACC Akun).
- **Payload:**
  ```json
  { "is_verified": true }
  ```

### `PUT /api/profiles/{id}/lock`
- **Fungsi:** Membuka atau menggembok akun secara manual (Suspen).
- **Payload:**
  ```json
  { "is_locked": true | false }
  ```

### `DELETE /api/profiles/{id}`
- **Fungsi:** Menghapus permanen akun pengguna.

---

## 2. 🏢 Divisi (Divisions)
Mengelola data divisi penempatan anak magang (IT, Media, PR, dll).

### `GET /api/divisions`
- **Fungsi:** Mengambil daftar divisi secara umum.

### `GET /api/divisions/analytics`
- **Fungsi:** Mengambil data divisi lengkap dengan statistik analitik (anggota, tugas, leaderboard, dll).

### `POST /api/divisions`
- **Fungsi:** Menambahkan divisi baru.
- **Payload:**
  ```json
  {
    "name": "IT Support",
    "icon": "fa-building",
    "color": "blue",
    "head": "Nama Kepala",
    "description": "Deskripsi divisi"
  }
  ```

### `PUT /api/divisions/{id}`
- **Fungsi:** Memperbarui data divisi yang sudah ada.

### `DELETE /api/divisions/{id}`
- **Fungsi:** Menghapus data divisi (Akan gagal jika `intern_count > 0`).

---

## 3. 📝 Daily Tasks (Logbook)
Mengelola tugas harian dan laporan logbook anak magang.

### `GET /api/daily-tasks`
- **Fungsi:** Mengambil daftar tugas harian. 
  - Jika yang memanggil `Intern`: Otomatis hanya melihat tugas miliknya.
  - Jika yang memanggil `Admin`: Melihat daftar Live Tasks (Tugas Dadakan).

### `POST /api/daily-tasks`
- **Fungsi:** Membuat "Tugas Dadakan / Live Task" baru untuk Intern tertentu.
- **Payload:**
  ```json
  {
    "uploader_id": "UUID_INTERN",
    "description": "Nama tugas",
    "due_date": "YYYY-MM-DD",
    "assign_note": "Catatan tugas",
    "division_id": "UUID_DIVISI"
  }
  ```

### `PUT /api/daily-tasks/{id}`
- **Fungsi:** Endpoint serbaguna (Intern mengupdate progress/foto ATAU Admin memberikan evaluasi approve/reject di dashboard).
- **Payload (Evaluasi):**
  ```json
  {
    "status": "approved" | "rejected",
    "reject_reason": "Alasan penolakan jika ditolak"
  }
  ```

### `DELETE /api/daily-tasks/{id}`
- **Fungsi:** Menghapus tugas.

### `GET /api/daily-tasks/pending`
- **Fungsi:** (Approval Center) Mengambil daftar semua tugas dengan status 'pending' (menunggu diperiksa Admin).

### `PUT /api/daily-tasks/{id}/status`
- **Fungsi:** (Approval Center) Alternatif update status persetujuan dari Admin.
- **Payload:**
  ```json
  {
    "status": "approved" | "rejected",
    "reviewer_notes": "Catatan dari Admin"
  }
  ```

---

## 4. 🤖 Task Templates (Blueprint Rutin)
Sistem otomatisasi yang dicopy oleh Cron Job ke *Daily Tasks* setiap jam 00:00.

### `GET /api/task-templates`
- **Fungsi:** Mengambil daftar blueprint tugas rutin.

### `POST /api/task-templates`
- **Fungsi:** Menambah blueprint tugas otomatis.
- **Payload:**
  ```json
  {
    "title": "Cek Suhu Server",
    "description": "Instruksi detail...",
    "division_id": "UUID_DIVISI"
  }
  ```

### `DELETE /api/task-templates/{id}`
- **Fungsi:** Menghapus blueprint.

---

## 5. 📨 Exceptions (Pengajuan Izin & Swap Shift)
Manajemen ketidakhadiran, sakit, izin, atau pergantian shift.

### `GET /api/exceptions/pending`
- **Fungsi:** Mengambil antrean surat izin yang menunggu ACC Admin (Approval Center).

### `PUT /api/exceptions/{id}/status`
- **Fungsi:** Evaluasi (Approve/Reject) pengajuan izin.
- **Payload:**
  ```json
  {
    "status": "approved" | "rejected",
    "description": "Alasan penolakan (jika ada)"
  }
  ```

---

## 6. 📖 Whiteboards (Whitebook / SOP)
Manajemen buku putih, pedoman, atau tutorial per-divisi.

### `GET /api/whiteboards`
- **Fungsi:** Mengambil daftar SOP. (Tergantung RLS atau Filter divisi di backend).

### `POST /api/whiteboards`
- **Fungsi:** Menambah SOP baru.
- **Payload:**
  ```json
  {
    "title": "Cara Konfigurasi Router",
    "type": "link" | "pdf" | "image",
    "file_url": "https://...",
    "icon": "fa-link"
  }
  ```

### `PUT /api/whiteboards/{id}`
- **Fungsi:** Update data SOP.

### `DELETE /api/whiteboards/{id}`
- **Fungsi:** Hapus SOP.

---

## 7. 📡 Broadcasts (FCM Push Notifications)
Sistem pengumuman massal ke HP target menggunakan Firebase Cloud Messaging.

### `GET /api/broadcasts/history`
- **Fungsi:** Melihat riwayat push notification yang pernah dikirim.

### `POST /api/broadcasts/send`
- **Fungsi:** Mengeksekusi pengiriman notifikasi.
- **Payload:**
  ```json
  {
    "title": "Info Penting!",
    "content": "Besok libur nasional.",
    "targetType": "global" | "division" | "personal",
    "targets": ["UUID1", "UUID2"] 
  }
  ```

---

## 8. 📊 Reports & Export
Rekapitulasi performa dan kehadiran.

### `GET /api/reports`
- **Fungsi:** Mengambil data JSON analitik performa.
- **Query Params:** `?month=YYYY-MM`

### `GET /api/reports/export-pdf`
- **Fungsi:** Men-generate dan mengunduh file PDF Laporan Performa Bulanan.
- **Query Params:** `?month=YYYY-MM&division=NamaDivisi`
- **Response Type:** `Blob` (File PDF)

---

## 9. 🛡 Audit Logs
Catatan Aktivitas Admin / Sistem (Read-Only).

### `GET /api/audit-logs`
- **Fungsi:** Mengambil log rekaman aktivitas. (Filter opsional: `?action=...`)