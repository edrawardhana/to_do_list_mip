# MIP Activity Technical Documentation

## 1. Pendahuluan

### 1.1 Apa itu MIP Activity

MIP Activity adalah sistem aplikasi manajemen aktivitas, tugas harian, logbook, absensi, izin, serta pengelolaan administrasi internal untuk pengguna dengan peran yang berbeda, seperti intern, admin divisi, dan super admin. Aplikasi ini dirancang untuk mendukung proses pelaporan kerja, review tugas, validasi administrasi, dan monitoring operasi secara terstruktur.

### 1.2 Tujuan Aplikasi

Tujuan utama aplikasi ini adalah:

- Menyediakan sistem pencatatan tugas harian secara terpusat.
- Memudahkan proses persetujuan tugas dan izin oleh pihak yang berwenang.
- Mendukung kolaborasi antar pengguna melalui fitur tugas bersama.
- Menyediakan dashboard khusus sesuai peran pengguna.
- Menjadi basis operasional yang dapat dipelihara dan dikembangkan secara berkelanjutan.

### 1.3 Target Pengguna

Pengguna utama aplikasi ini meliputi:

- Intern: mengajukan tugas, melaporkan aktivitas, mengirim bukti, dan mengakses dashboard personal.
- Admin Divisi: meninjau, mengonfirmasi, dan mengelola tugas yang masuk dari divisinya.
- Super Admin: mengelola sistem, user, template tugas, konfigurasi, serta pemantauan keseluruhan aplikasi.
- IT Support / Administrator Sistem: melakukan deploy, maintenance, troubleshooting, dan backup restore.
- Developer: melakukan pengembangan fitur dan perbaikan bug.

### 1.4 Gambaran Umum Sistem

Secara umum, sistem ini terdiri dari:

- Frontend web berbasis React untuk antarmuka pengguna.
- Backend API berbasis Laravel untuk logika bisnis, otorisasi, dan akses data.
- Database relasional untuk penyimpanan data operasional.
- Storage terpisah untuk berkas bukti yang di-host melalui Supabase Storage.
- Integrasi notifikasi dan autentikasi yang mendukung alur kerja harian.

> TODO: Isi bagian ini lebih lanjut sesuai skenario bisnis aktual jika terdapat kebutuhan spesifik tambahan.

---

## 2. Arsitektur Sistem

### 2.1 Frontend

Frontend dibangun dengan React melalui Vite. Antarmuka pengguna mengakomodasi fitur dashboard, form tugas, manajemen profil, halaman admin, dan modul khusus untuk super admin dan intern.

Komponen frontend mencakup:

- Halaman autentikasi.
- Dashboard berdasarkan peran.
- Modul tugas harian.
- Modul izin, absensi, dan exception.
- Halaman manajemen pengguna dan konfigurasi sistem.

### 2.2 Backend

Backend dibangun menggunakan Laravel 12 dengan struktur MVC yang memisahkan controller, model, service logic, dan routing. Backend menyediakan API yang diakses oleh frontend dan menangani autentikasi, validasi, workflow approval, storage file, dan logika bisnis terkait tugas dan pengguna.

### 2.3 Database

Sistem menggunakan basis data relasional. Berdasarkan dokumentasi proyek, database yang digunakan adalah PostgreSQL dengan dukungan integrasi ke Supabase. Struktur database tidak seluruhnya terpapar di repo secara eksplisit, sehingga bagian skema tabel perlu diverifikasi dari migrasi dan model aplikasi.

### 2.4 API

API dikembangkan dengan pendekatan RESTful melalui Laravel routes. Beberapa endpoint utama mencakup:

- Autentikasi pengguna.
- Manajemen tugas harian.
- Manajemen exception/izin.
- Manajemen profil dan akun.
- Dashboard role-based.
- Notifikasi dan broadcast.
- Laporan dan analytics.

### 2.5 Authentication

Autentikasi saat ini didasarkan pada JWT melalui Laravel JWT auth. Rute autentikasi tersedia di endpoint auth. Otorisasi terbagi berdasarkan peran pengguna: intern, admin, dan super admin.

### 2.6 Storage

Berkas bukti tugas disimpan di storage eksternal melalui Supabase Storage yang kompatibel dengan driver S3. Penggunaan URL sementara untuk file privat menjadi bagian penting dari arsitektur untuk keamanan dan performa.

### 2.7 Queue

Laravel queue digunakan untuk pemrosesan pekerjaan asynchronous, terutama yang berkaitan dengan proses background atau notifikasi. Pengaturan queue dapat dikonfigurasi sesuai kebutuhan server.

### 2.8 Notification

Sistem mendukung notifikasi melalui integrasi FCM/Firebase dan mekanisme broadcast/notification internal. Fitur ini digunakan untuk memberi tahu pengguna atas status tugas, pengajuan izin, atau pembaruan sistem.

### 2.9 Deployment

Project ini memiliki Dockerfile untuk frontend dan backend, sehingga deployment dapat dilakukan baik secara langsung maupun melalui container. Detail environment server, reverse proxy, dan konfigurasi hosting perlu diperlengkapi sesuai target deployment.

> TODO: Lengkapi bagian deployment dengan detail host, domain, SSL, dan lingkungan produksi yang digunakan.

---

## 3. Technology Stack

| Komponen            | Teknologi            |    Versi | Fungsi                                                 |
| ------------------- | -------------------- | -------: | ------------------------------------------------------ |
| Bahasa Backend      | PHP                  |     ^8.2 | Menjalankan logika server dan API                      |
| Framework Backend   | Laravel              |     12.x | Framework utama untuk API, routing, auth, dan database |
| Database            | PostgreSQL           |      TBD | Penyimpanan data utama aplikasi                        |
| Database Service    | Supabase             |      TBD | Hosting database dan storage terkait bukti tugas       |
| Frontend            | React                |   19.2.0 | Membangun antarmuka pengguna                           |
| Build Tool Frontend | Vite                 |    7.3.1 | Tool dev server dan build frontend                     |
| Styling             | Tailwind CSS         |   3.4.19 | Styling UI dan desain responsif                        |
| HTTP Client         | Axios                |   1.15.0 | Menghubungkan frontend ke backend                      |
| State Management    | Zustand              |  ^5.0.14 | State global aplikasi                                  |
| Data Fetching       | TanStack React Query | ^5.101.0 | Manajemen fetching dan caching data                    |
| Storage Client      | Supabase JS          |  2.103.0 | Integrasi client-side ke Supabase                      |
| Push Notification   | Firebase             |  12.12.0 | Integrasi notifikasi push                              |
| Dokumentasi/Export  | DOMPDF               |     ^3.1 | Pembuatan dokumen PDF                                  |
| Image Processing    | Intervention Image   |     ^3.0 | Pemrosesan gambar upload                               |
| Container           | Docker               |      TBD | Menyediakan lingkungan konsisten                       |
| Web Server          | Nginx / Apache       |      TBD | Menjadi layer reverse proxy dan hosting                |
| Cache               | Redis / File Cache   |      TBD | Pengelolaan cache dan performa                         |

> TODO: Isi versi yang pasti untuk komponen yang belum terverifikasi dari environment deployment.

---

## 4. Struktur Folder Project

### 4.1 Struktur Utama

```text
to_do_list_mip/
├── Backend/
├── Frontend/
├── README.md
└── MIP_Activity_Technical_Documentation.md
```

### 4.2 Penjelasan Folder

#### Backend

- app/: berisi model, controller, middleware, provider, dan logika aplikasi.
- bootstrap/: file bootstrap aplikasi Laravel.
- config/: konfigurasi aplikasi, database, auth, cache, mail, filesystem, queue, dan lainnya.
- database/: migrasi, factory, seeders, dan struktur data awal.
- public/: entry point aplikasi web, asset publik, dan file index.php.
- resources/: view, aset frontend, template blade, atau asset yang diproses oleh Laravel.
- routes/: definisi endpoint API, web route, dan console command.
- storage/: file runtime, cache, log, dan upload.
- tests/: unit dan feature testing.
- vendor/: dependency yang diinstall oleh Composer.

#### Frontend

- src/: sumber utama aplikasi frontend.
- src/components/: komponen UI reusable.
- src/pages/: halaman utama berdasarkan modul.
- src/contexts/: konteks global seperti autentikasi.
- src/services/: layer komunikasi dengan backend.
- src/store/: state management.
- src/assets/: aset visual dan gambar.
- public/: file publik yang dapat diakses langsung.
- dokumentasi/: dokumen pelengkap terkait penggunaan atau troubleshooting.

#### Root Project

- README.md: dokumentasi awal project.
- MIP_Activity_Technical_Documentation.md: dokumentasi teknis utama.

> TODO: Tambahkan penjelasan folder tambahan jika project dikembangkan lebih lanjut sebagai monorepo atau modular.

---

## 5. Database

### 5.1 Struktur Database

Struktur database aplikasi belum didokumentasikan sepenuhnya dalam repo. Namun berdasarkan modul aplikasi, skema yang umumnya relevan mencakup entitas berikut:

- users
- divisions
- daily_tasks
- exceptions
- task_templates
- profiles
- schedules
- notifications
- broadcasts
- system_configs
- audit_logs

> TODO: Validasi nama tabel dan kolom sesungguhnya berdasarkan migrasi yang ada di folder database/migrations.

### 5.2 Penjelasan Setiap Tabel

Berikut template penjelasan tabel yang dapat diisi saat skema final tersedia:

| Nama Tabel     | Keterangan                                           | Primary Key | Foreign Key          |
| -------------- | ---------------------------------------------------- | ----------- | -------------------- |
| users          | Data akun pengguna                                   | id          | -                    |
| divisions      | Data divisi atau unit kerja                          | id          | -                    |
| daily_tasks    | Data tugas harian/logbook                            | id          | user_id, division_id |
| exceptions     | Data izin, sakit, tugas luar, atau permohonan khusus | id          | user_id              |
| task_templates | Template tugas yang digunakan untuk generate tugas   | id          | division_id          |
| profiles       | Data profil tambahan pengguna                        | id          | user_id              |
| schedules      | Data jadwal/shift                                    | id          | user_id, division_id |
| notifications  | Notifikasi sistem                                    | id          | user_id              |
| broadcasts     | Pesan broadcast admin/super admin                    | id          | user_id              |
| system_configs | Konfigurasi sistem                                   | id          | -                    |
| audit_logs     | Log aktivitas sistem                                 | id          | user_id              |

### 5.3 Relasi Tabel

Relasi yang umum diperkirakan:

- users ke daily_tasks: satu user memiliki banyak tugas.
- divisions ke daily_tasks: setiap tugas terkait satu divisi.
- divisions ke task_templates: satu divisi memiliki banyak template tugas.
- users ke exceptions: satu user memiliki banyak exception.
- users ke notifications: satu user dapat menerima banyak notifikasi.

### 5.4 Primary Key dan Foreign Key

- Primary Key sebaiknya menggunakan `id` bertipe UUID atau integer auto increment sesuai kebijakan migrasi.
- Foreign Key digunakan untuk hubungan antar tabel yang saling terkait.

### 5.5 Index

Index sebaiknya dibuat pada kolom yang sering dipakai dalam pencarian, sorting, dan filter, seperti:

- `email`
- `role`
- `division_id`
- `status`
- `submitted_at`
- `created_at`

### 5.6 Migration

Migration adalah cara resmi untuk membentuk struktur database. Semua perubahan skema harus dijalankan melalui migration.

Contoh perintah:

```bash
php artisan make:migration create_table_name
php artisan migrate
php artisan migrate:rollback
```

### 5.7 Seeder

Seeder digunakan untuk mengisi data awal seperti:

- Role dan permission default.
- Divisi awal.
- User awal.
- Template tugas default.

Contoh perintah:

```bash
php artisan db:seed
php artisan make:seeder UserSeeder
```

---

## 6. Environment Configuration

File environment utama berada di backend pada `.env`. File ini berisi konfigurasi runtime yang menentukan perilaku aplikasi.

### 6.1 Variabel Umum

Contoh variabel yang biasanya digunakan:

```env
APP_NAME=MIP Activity
APP_ENV=local
APP_KEY=base64:...
APP_DEBUG=true
APP_URL=http://localhost
```

### 6.2 Konfigurasi Database

```env
DB_CONNECTION=pgsql
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=mip_activity
DB_USERNAME=postgres
DB_PASSWORD=secret
```

### 6.3 Konfigurasi Mail

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USERNAME=your-mail-user
MAIL_PASSWORD=your-mail-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=no-reply@example.com
MAIL_FROM_NAME="MIP Activity"
```

### 6.4 Konfigurasi Queue

```env
QUEUE_CONNECTION=database
```

### 6.5 Konfigurasi Supabase dan Storage

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key
SUPABASE_BUCKET=evidences
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_DEFAULT_REGION=ap-southeast-1
AWS_BUCKET=evidences
AWS_ENDPOINT=https://your-project.supabase.co/storage/v1/s3
AWS_USE_PATH_STYLE_ENDPOINT=true
```

### 6.6 Konfigurasi Frontend

```env
VITE_API_URL=http://127.0.0.1:8000/api
```

### 6.7 Catatan Keamanan

- Jangan pernah commit file `.env` ke repository.
- Gunakan credential yang berbeda untuk environment development, staging, dan production.
- Simpan secret key di manajer secret yang aman jika digunakan di server produksi.

---

## 7. Instalasi Project

### 7.1 Clone Repository

```bash
git clone <repository-url>
cd to_do_list_mip
```

### 7.2 Install Dependency Backend

```bash
cd Backend
composer install
```

### 7.3 Install Dependency Frontend

```bash
cd ../Frontend
npm install
```

### 7.4 Generate Application Key

```bash
cd ../Backend
cp .env.example .env
php artisan key:generate
```

### 7.5 Jalankan Migrasi dan Seeder

```bash
php artisan migrate --seed
```

### 7.6 Buat Storage Link

```bash
php artisan storage:link
```

### 7.7 Build Asset Frontend

```bash
cd ../Frontend
npm run build
```

### 7.8 Jalankan Aplikasi

Backend:

```bash
cd ../Backend
php artisan serve
```

Frontend:

```bash
cd ../Frontend
npm run dev
```

### 7.9 Flutter Pub Get

Tidak terdeteksi pada repositori saat ini. Jika pada masa depan aplikasi mobile ditambahkan, langkah instalasi dapat ditambahkan sebagai berikut:

```bash
flutter pub get
```

> TODO: Tambahkan langkah instalasi khusus untuk lingkungan deployment atau Docker jika diperlukan.

---

## 8. Konfigurasi Server

### 8.1 Linux

Pada server Linux, pastikan sistem memiliki:

- PHP 8.2+
- Composer
- Node.js 18+
- Database PostgreSQL
- Web server Nginx atau Apache

Langkah umum:

```bash
sudo apt update
sudo apt install php php-cli php-fpm php-mbstring php-xml php-gd php-pgsql composer nginx
```

### 8.2 Windows

Untuk lingkungan Windows, gunakan:

- XAMPP, Laragon, atau WAMP untuk pengembangan lokal.
- IIS atau Apache jika akan dijalankan sebagai server web.
- PostgreSQL atau Supabase sebagai sumber data.

### 8.3 Apache

Konfigurasi Virtual Host perlu diarahkan ke folder public Laravel.

Contoh struktur konfigurasi:

```apache
<VirtualHost *:80>
    ServerName mip-activity.local
    DocumentRoot /var/www/to_do_list_mip/Backend/public
    <Directory /var/www/to_do_list_mip/Backend/public>
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

### 8.4 Nginx

Contoh konfigurasi Nginx:

```nginx
server {
    listen 80;
    server_name mip-activity.local;
    root /var/www/to_do_list_mip/Backend/public;

    index index.php;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        include fastcgi_params;
        fastcgi_pass unix:/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    }
}
```

### 8.5 PHP

Pastikan ekstensi berikut aktif:

- `pdo_pgsql`
- `mbstring`
- `xml`
- `zip`
- `gd`
- `curl`

### 8.6 Database

- Konfigurasi database harus sesuai dengan `.env` backend.
- Pastikan user database memiliki hak akses untuk migrasi dan operasi CRUD.

### 8.7 SSL

Gunakan SSL/TLS untuk lingkungan produksi.
Rekomendasi:

- Let’s Encrypt
- Certbot
- Reverse proxy yang mendukung HTTPS

### 8.8 Domain

Domain production harus diarahkan ke server dan dikonfigurasi di web server.

### 8.9 Deployment

Deployment dapat dilakukan dengan:

- Git pull di server.
- Composer install.
- NPM install dan build.
- Migrasi database.
- Restart service PHP-FPM dan web server.

---

## 9. Authentication

### 9.1 Mekanisme Login

Login dilakukan melalui endpoint autentikasi backend. Setelah login berhasil, sistem mengembalikan token yang digunakan untuk mengakses endpoint terproteksi.

### 9.2 Role Pengguna

Role yang dikonfirmasi dari dokumentasi proyek:

- intern
- admin
- super_admin

### 9.3 Permission

Akses fitur dibatasi berdasarkan role. Misalnya:

- Intern hanya dapat mengakses data tugas dan profil miliknya.
- Admin divisi mengelola tugas divisinya.
- Super admin mengakses konfigurasi sistem dan data lintas divisi.

### 9.4 Middleware

Middleware digunakan untuk mengontrol akses dan validasi status akun, misalnya middleware pemeriksaan lock akun.

### 9.5 JWT

Sistem menggunakan JWT untuk autentikasi API. Token harus disertakan pada header request untuk endpoint yang terlindungi.

Contoh header:

```http
Authorization: Bearer <token>
```

### 9.6 Sanctum

Saat ini dokumentasi proyek menunjukkan penggunaan JWT, bukan Sanctum. Apabila ada kebutuhan perubahan autentikasi ke Sanctum, perlu dilakukan penyesuaian secara terstruktur.

---

## 10. API Documentation

### 10.1 Format Dokumentasi API

| Field            | Keterangan                    |
| ---------------- | ----------------------------- |
| Method           | HTTP method yang digunakan    |
| Endpoint         | Path endpoint                 |
| Request          | Parameter, body, atau query   |
| Header           | Authorization dan header lain |
| Response         | Struktur respons sukses       |
| Error Response   | Struktur respons error        |
| Example Request  | Contoh payload                |
| Example Response | Contoh output                 |

### 10.2 Template Endpoint

#### Contoh: Login

- Method: `POST`
- Endpoint: `/api/auth/login`
- Header: `Content-Type: application/json`
- Request Body:

```json
{
  "email": "user@example.com",
  "password": "password"
}
```

- Response Success:

```json
{
  "message": "Login successful",
  "user": {},
  "token": "..."
}
```

- Error Response:

```json
{
  "message": "Unauthorized"
}
```

### 10.3 Endpoint Utama yang Tersedia

Berdasarkan routing backend, endpoint utama mencakup:

- `/api/auth/login`
- `/api/auth/me`
- `/api/auth/logout`
- `/api/daily-tasks`
- `/api/daily-tasks/{id}/submit`
- `/api/daily-tasks/{id}/confirm`
- `/api/exceptions`
- `/api/profiles`
- `/api/notifications`
- `/api/dashboard/{role}`
- `/api/reports/monthly`

> TODO: Lengkapi dokumentasi endpoint per modul secara rinci sesuai implementasi final.

---

## 11. Modul Aplikasi

### 11.1 Modul Autentikasi

- Tujuan: memungkinkan pengguna login, logout, dan melihat profil.
- Flow: user memasukkan kredensial → backend memvalidasi → token dibuat → akses halaman sesuai role.
- Controller: `AuthController`
- Model: `User`
- Migration: `users` table
- View: halaman login dan profile
- API: `/api/auth/login`, `/api/auth/me`, `/api/auth/logout`
- Business Logic: validasi kredensial, token generation, role-based authorization

### 11.2 Modul Daily Task / Logbook

- Tujuan: mencatat tugas harian, submit bukti, dan review status.
- Flow: user membuat tugas → memeriksa status → submit bukti → admin meninjau → approve/reject.
- Controller: `DailyTaskController`
- Model: `DailyTask`
- Migration: tabel tugas harian
- View: dashboard logbook dan form submission
- API: `/api/daily-tasks`
- Business Logic: status workflow, approval, attachment handling

### 11.3 Modul Exception / Izin

- Tujuan: menangani permohonan izin, sakit, tugas luar, atau kebutuhan khusus.
- Flow: user mengajukan exception → admin meninjau → keputusan diteruskan ke user.
- Controller: `ExceptionController`
- Model: `Exception`
- Migration: tabel exception
- View: form pengajuan dan list review
- API: `/api/exceptions`
- Business Logic: validasi status, notifikasi, pencatatan history

### 11.4 Modul Whiteboard

- Tujuan: mengelola task breakdown atau ide kerja secara visual/kolaboratif.
- Flow: user atau admin membuat whiteboard → isi detail task → AI breakdown atau konsultasi dilakukan.
- Controller: `WhiteboardController`, `WhiteboardAIController`
- Model: `Whiteboard`
- Migration: tabel whiteboard
- View: halaman whiteboard
- API: `/api/whiteboards`, `/api/ai/generate-breakdown`, `/api/whiteboards/ask`
- Business Logic: task decomposition, AI assistance, storage content

### 11.5 Modul Task Template

- Tujuan: menyediakan template tugas untuk generate kegiatan otomatis.
- Flow: super admin/admin membuat template → template dipakai untuk menghasilkan tugas harian.
- Controller: `TaskTemplateController`
- Model: `TaskTemplate`
- Migration: tabel task_templates
- View: halaman template manajemen
- API: `/api/task-templates`
- Business Logic: template management dan generate tugas

### 11.6 Modul Profil dan User Management

- Tujuan: mengelola profil pengguna, avatar, tanda tangan, dan akun.
- Flow: user mengupload avatar/signature → data tersimpan → ditampilkan di dashboard atau dokumen.
- Controller: `ProfileController`
- Model: `Profile` atau extend dari `User`
- Migration: tabel profiles
- View: halaman profil dan manajemen akun
- API: `/api/profiles`
- Business Logic: upload file, reset password, bulk import, lock account

### 11.7 Modul Dashboard

- Tujuan: menampilkan data ringkas sesuai role pengguna.
- Flow: backend mengambil data dari model terkait → dashboard menampilkan ringkasan status.
- Controller: `SuperadminDashboardController`, `AdminDashboardController`, `InternDashboardController`
- View: halaman dashboard role-based
- API: `/api/dashboard/superadmin`, `/api/dashboard/admin`, `/api/dashboard/intern`

### 11.8 Modul Notification dan Broadcast

- Tujuan: menyampaikan pemberitahuan kepada pengguna.
- Flow: event atau aksi sistem memicu notifikasi → data masuk ke tabel notifikasi/broadcast → frontend menampilkannya.
- Controller: `NotificationController`, `BroadcastController`
- API: `/api/notifications`, `/api/broadcasts`

### 11.9 Modul Report dan Analytics

- Tujuan: menghasilkan ringkasan performa dan data operasional.
- Flow: admin/super admin memanggil endpoint → data agregasi dikembalikan → dashboard/report dirender.
- Controller: `ReportController`
- API: `/api/reports/monthly`

---

## 12. Alur Sistem

Berikut alur sistem umum yang terjadi pada aplikasi:

1. User melakukan login.
2. Sistem memvalidasi kredensial dan token.
3. User diarahkan ke dashboard sesuai role.
4. User memilih menu yang sesuai, misalnya tugas harian atau izin.
5. Data diinput atau dipilih melalui form.
6. Data divalidasi oleh backend.
7. Data disimpan ke database.
8. Jika diperlukan, file bukti diupload ke storage.
9. Sistem mengirim notifikasi atau mengubah status workflow.
10. Admin atau super admin meninjau dan mengambil keputusan.
11. Status akhir disimpan dan ditampilkan kembali di dashboard.

Contoh alur sederhana:

```text
User Login
↓
Dashboard
↓
Pilih Menu
↓
Input Data
↓
Validasi
↓
Simpan ke Database
↓
Notifikasi / Approval
↓
Status Final
```

---

## 13. Error Handling

### 13.1 Jenis Error

- Validation Error: input tidak memenuhi aturan.
- Authentication Error: token tidak valid atau expired.
- Authorization Error: user tidak memiliki akses.
- Database Error: koneksi atau query gagal.
- Storage Error: upload atau akses file gagal.
- Network Error: frontend gagal terhubung ke backend.

### 13.2 Penyebab Umum

- Input tidak valid.
- Token kadaluarsa.
- Hak akses belum ditetapkan.
- Database belum migrasi.
- Konfigurasi env salah.
- File storage tidak terhubung.

### 13.3 Solusi

- Periksa error message dari backend.
- Pastikan `.env` sesuai.
- Jalankan `php artisan config:clear` dan `php artisan cache:clear` jika diperlukan.
- Cek log aplikasi.
- Verifikasi koneksi database dan storage.

### 13.4 Troubleshooting

Langkah troubleshooting yang umum:

1. Periksa log error di backend.
2. Uji endpoint menggunakan Postman atau curl.
3. Verifikasi token dan header authorization.
4. Pastikan migrasi database berhasil.
5. Periksa konfigurasi file storage dan bucket.

---

## 14. Logging

### 14.1 Lokasi Log

Log aplikasi Laravel biasanya berada di:

```text
Backend/storage/logs/laravel.log
```

### 14.2 Cara Membaca Log

- Buka file log secara berkala.
- Cari pesan error, stack trace, dan timestamp.
- Fokus pada bagian `Exception`, `SQLSTATE`, dan `file`.

### 14.3 Cara Debugging

- Aktifkan `APP_DEBUG=true` pada environment development.
- Gunakan `php artisan tinker` untuk uji kondisi tertentu.
- Tambahkan log manual jika diperlukan:

```php
Log::info('Informasi penting', ['data' => $data]);
Log::error('Terjadi kesalahan', ['exception' => $e]);
```

### 14.4 Tool Pendukung

- Laravel Telescope dapat dipakai untuk observability selama development.
- Browser console dapat dipakai untuk debugging frontend.

---

## 15. Backup & Restore

### 15.1 Backup Database

Backup database dapat dilakukan dengan perintah:

```bash
pg_dump -U <user> -d <database> > backup.sql
```

### 15.2 Backup Storage

Backup file upload yang ada di Supabase Storage atau direktori storage lokal.

### 15.3 Restore Database

```bash
psql -U <user> -d <database> < backup.sql
```

### 15.4 Recovery

Jika terjadi kerusakan sistem:

1. Restore database dari backup terbaru.
2. Restore file storage yang relevan.
3. Jalankan migrasi dan periksa konfigurasi.
4. Verifikasi aplikasi berjalan normal.

> TODO: Tambahkan instruksi restore yang lebih spesifik sesuai environment produksi.

---

## 16. Maintenance

### 16.1 Update Project

Langkah update aplikasi:

```bash
git pull
cd Backend
composer install
cd ../Frontend
npm install
```

### 16.2 Jalankan Migrasi

```bash
cd Backend
php artisan migrate
```

### 16.3 Rollback

```bash
php artisan migrate:rollback
```

### 16.4 Clear Cache

```bash
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
```

### 16.5 Optimize Aplikasi

```bash
php artisan optimize
```

### 16.6 Restart Queue

```bash
php artisan queue:restart
php artisan queue:work
```

---

## 17. Security

### 17.1 Validation

Semua input harus divalidasi di backend sebelum diproses lebih lanjut.

### 17.2 Authentication

Gunakan mekanisme autentikasi yang aman dan token yang tidak mudah dibocorkan.

### 17.3 Authorization

Akses harus dibatasi berdasarkan peran pengguna.

### 17.4 SQL Injection

Gunakan query builder/Eloquent daripada raw query yang tidak aman.

### 17.5 CSRF

Untuk aplikasi berbasis browser, perlindungan CSRF harus diterapkan sesuai kebutuhan framework.

### 17.6 XSS

Filter dan escape output sebelum ditampilkan di frontend.

### 17.7 Rate Limit

Batasi jumlah request untuk endpoint sensitif guna mencegah abuse.

### 17.8 Encryption

Gunakan enkripsi untuk data sensitif yang disimpan atau dikirim.

### 17.9 Password Hashing

Password harus disimpan dalam bentuk hash yang aman, bukan plain text.

### 17.10 Backup

Backup rutin dan kontrol akses ke data penting wajib dilakukan.

---

## 18. FAQ Developer

### Q1: Bagaimana cara menjalankan backend?

Jalankan perintah berikut:

```bash
cd Backend
composer install
php artisan serve
```

### Q2: Bagaimana cara menjalankan frontend?

```bash
cd Frontend
npm install
npm run dev
```

### Q3: Apa yang harus dilakukan jika database error muncul?

Periksa koneksi `.env`, jalankan migrasi, dan cek log Laravel.

### Q4: Apa yang harus dilakukan jika upload file gagal?

Periksa konfigurasi storage, bucket, dan permission folder.

### Q5: Bagaimana cara membersihkan cache?

Gunakan perintah `php artisan cache:clear` dan `php artisan config:clear`.

### Q6: Apakah aplikasi sudah mendukung notifikasi push?

Ya, terdapat integrasi Firebase pada frontend/backend yang relevan, namun detail implementasi perlu diverifikasi lebih lanjut.

### Q7: Apakah aplikasi mendukung deployment via Docker?

Ya, repository memiliki Dockerfile untuk backend dan frontend, namun konfigurasi deployment produksi perlu disesuaikan.

---

## 19. Changelog

### Template Changelog

```markdown
## [Versi] - YYYY-MM-DD

### Added

- Fitur baru

### Changed

- Perubahan pada modul tertentu

### Fixed

- Perbaikan bug

### Removed

- Fitur yang dihapus
```

### Contoh

```markdown
## [1.0.0] - 2026-06-27

### Added

- Dokumentasi teknis awal
- Struktur dokumentasi developer guide

### Changed

- Tidak ada

### Fixed

- Tidak ada
```

---

## 20. Lampiran

### 20.1 Template ERD

```text
[Entity A] --1---N-- [Entity B]
```

### 20.2 Template Flowchart

```text
Start
→ Login
→ Validasi
→ Dashboard
→ Proses Data
→ Selesai
```

### 20.3 Template Sequence Diagram

```text
User -> Frontend: Input data
Frontend -> Backend: Request API
Backend -> Database: Simpan data
Database -> Backend: Response
Backend -> Frontend: Response
Frontend -> User: Tampilkan hasil
```

### 20.4 Template Use Case

- User Login
- User Membuat Tugas
- Admin Menyetujui Tugas
- Super Admin Mengelola Template

### 20.5 Template Activity Diagram

```text
Start
→ Pilih Modul
→ Input Data
→ Validasi
→ Simpan
→ Notifikasi
→ End
```

### 20.6 Template Class Diagram

```text
User
DailyTask
Exception
Division
TaskTemplate
Profile
```

### 20.7 Template Deployment Diagram

```text
Client Browser -> Frontend Server
Frontend Server -> Backend API
Backend API -> Database
Backend API -> Storage Service
```

> TODO: Tambahkan diagram yang sesuai dengan implementasi aktual setelah skema dan arsitektur final tersedia.
