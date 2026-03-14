# Panduan Otomatisasi Database (Supabase)

Dokumen ini berisi penjelasan fitur-fitur yang berjalan secara otomatis di belakang layar (*Autopilot*) menggunakan fitur bawaan Supabase (PostgreSQL), sehingga mengurangi beban kerja backend Laravel.

## 1. Cron Job: Auto-Lock & Auto-Unlock Harian
**Lokasi Script SQL:** `supabase_auto_lock_cron.sql`

Sistem ini memastikan karyawan (role: `user`) hanya bisa mengakses aplikasi selama jam kerja.

*   **Tutup Jam (21:30 WIB):** Database secara otomatis mengubah status `is_locked = true` untuk semua karyawan. Sesi login/token JWT mereka akan jadi tidak berguna (401/403).
*   **Buka Jam (07:30 WIB):** Database secara otomatis mengubah status `is_locked = false` untuk semua karyawan, menandakan shift absen pagi dimulai.
*   **Pengecualian:** Role `admin` dan `superadmin` tidak akan pernah terkena efek kunci jam kerja ini.
*   *Catatan Teknis:* Supabase menggunakan zona waktu UTC. Jam WIB - 7 jam = Jam UTC (ex: 21:30 WIB -> 14:30 UTC).

## 2. Row Level Security (RLS) Isolasi Per-Divisi
**Lokasi Script SQL:** `supabase_rls_strict_isolation.sql`

Sistem ini adalah benteng pertahanan terakhir (The Last Line of Defense) untuk memastikan data anak divisi A (misal IT) haraam terlihat oleh anak divisi B (misal Media), meskipun ada celah/bug di kodingan Backend (Laravel) atau Frontend.

*   **User:** Hanya bisa melihat dan mengolah datanya sendiri (Logbook, Absen), namun bisa melihat Pengumuman (Whiteboard) dari divisinya (tapi tidak bisa mengedit).
*   **Admin:** Bisa melihat semua isi Logbook, Pengumuman, dan Absen karyawan **HANYA** jika karyawan tersebut satu divisi dengannya (`division_id` yang sama).
*   **Superadmin:** Memiliki akses seperti dewa, bisa melihat dan menghapus data lintas divisi apa saja tanpa batas.

## 3. Storage Bucket & Keamanannya
**Lokasi Script SQL:** `supabase_storage_setup.sql`

Penyimpanan foto bukti/lapiran logbook dipisah ke Supabase Storage (bukan di dalam VPS Backend) agar server Backend tidak cepat penuh (Full Disk).

*   **Nama Bucket:** `task_evidence`.
*   **URL Foto:** Publik, bisa langsung digunakan di tag `<img>` Frontend.
*   **Aturan Upload:** Hanya pengguna yang sedang login yang bisa mengunggah file. Orang jahil yang mencoba menebak API upload Supabase akan ditolak jika tidak membawa Token.
*   **Aturan Hapus:** Karyawan hanya bisa menghapus kumpulan foto miliknya sendiri. Superadmin bebas menghapus foto siapa saja. Admin biasa tidak bisa asal menghapus. 

## 4. Trigger Kehadiran Otomatis Mengunci Akun
**Lokasi Script SQL:** `supabase_attendance_trigger.sql`

Bayangkan karyawan lapor sakit lewat WhatsApp ke HRD, lalu HRD mengubah status absennya menjadi `Sakit` dari dashboard admin. Sesuai prosedur, karyawan yang libur tidak boleh masuk aplikasi sama sekali.

*   **Cara Kerja:** Setiap kali ada record absen di-Insert atau di-Update menjadi `Izin` atau `Sakit`, database akan *nyambar* secara otomatis untuk mengganti `is_locked = true` di tabel Profile karyawan bersangkutan.
*   **Koreksi Salah Input:** Jika Admin salah pencet (awalnya `Sakit` diralat jadi `Hadir`), sistem juga sebaliknya akan otomatis memutar balik `is_locked = false`, sehingga user langsung bisa login lagi.
*   **Tanpa Bantuan Laravel:** Tidak perlu menambahkan kodingan *update profiles* di Backend Laravel. Database jalan mandiri.

## 5. Trigger Penyegelan Bukti Foto (Evidence Lock)
**Lokasi Script SQL:** `supabase_evidence_lock_trigger.sql`

Untuk menghindari kecurangan karyawan yang mengubah laporannya di kemudian hari tanpa sepengetahuan atasan (misal mengganti foto bukti progres kerja).

*   **Sekali Upload:** Ketika nilai `evidence_url` di tabel `daily_tasks` sudah terisi untuk pertama kalinya, data foto tersebut *disegel* mati pakai getah paten.
*   **Penolakan Akses:** Jika karyawan mencoba mengunggah foto kedua untuk menimpa foto pertama pada ID tugas yang sama, Supabase akan menolak proses *Update* tersebut dan memberikan pesan error panjang: `"Akses Ditolak: Bukti foto..."`
*   **Hak Akses Revisi:** Jika memang ada kesalahan ketidaksengajaan gambar, karyawan harus memohon kepada Admin. Karena Admin (dan Superadmin) adalah satu-satunya entitas yang kebal dari trigger penyegelan ini dan bisa menimpa kolom foto tersebut.

## 6. Cron Job: Generate Template Tugas Harian
**Lokasi Script SQL:** `supabase_generate_daily_tasks_cron.sql`

Sistem ini meringankan beban user maupun admin agar tidak perlu repot-repot mengetik tugas harian secara manual setiap pagi.

*   **Cara Kerja:** Tepat pada pukul **00:00 WIB** (sekali sehari), database akan menyortir semua orang yang menjabat sebagai `'user'` dan memiliki Divisi.
*   **Distribusi Otomatis:** Sistem akan menarik semua *Template Tugas* (`task_templates`) milik masing-masing Divisi, dan mendistribusikannya atau menyalinnya langsung ke dalam *Logbook* (`daily_tasks`) karyawan yang ada di Divisi tersebut.
*   **Hasil Instan:** Begitu karyawan masuk kerja (absen pagi), daftar pekerjaannya (ToDo List) hari itu sudah otomatis muncul secara instan di dalam Logbook, dengan status `Pending`.
