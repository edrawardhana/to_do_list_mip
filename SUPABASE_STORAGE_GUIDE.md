# Panduan Lengkap Integrasi & Troubleshooting Supabase Storage
### MIP Activity Logbook & To-Do List System

Dokumen ini merupakan panduan teknis komprehensif mengenai arsitektur penyimpanan berkas (*file storage*), manajemen kredensial/kunci (S3 Keys), penanganan berkas publik vs privat, serta solusi sistematis atas masalah berkas foto profil yang mengalami **404 Not Found**, **403 Forbidden**, atau gambar rusak (*broken image*).

---

## Daftar Isi
1. [Arsitektur & Konsep Dasar Penyimpanan](#1-arsitektur--konsep-dasar-penyimpanan)
2. [Klasifikasi Bucket: Public vs Private](#2-klasifikasi-bucket-public-vs-private)
3. [Manajemen Kunci & Kredensial Supabase (S3 Keys)](#3-manajemen-kunci--kredensial-supabase-s3-keys)
4. [Panduan Troubleshooting URL Foto Profil (Avatar)](#4-panduan-troubleshooting-url-foto-profil-avatar)
5. [Mekanisme Penyimpanan Berkas Sensitif (Bukti, Izin, Tanda Tangan)](#5-mekanisme-penyimpanan-berkas-sensitif-bukti-izin-tanda-tangan)
6. [Praktik Terbaik: Kompresi, Pembersihan & Fallback Offline](#6-praktik-terbaik-kompresi-pembersihan--fallback-offline)
7. [Matriks Diagnostik Cepat Masalah Storage](#7-matriks-diagnostik-cepat-masalah-storage)

---

## 1. Arsitektur & Konsep Dasar Penyimpanan

Sistem MIP Activity menggunakan arsitektur *hybrid-ready* yang menghubungkan Laravel 11 dengan **Supabase Storage** melalui driver kompatibel AWS S3 (`league/flysystem-aws-s3-v3`).

```
┌─────────────────┐       Upload File        ┌─────────────────────────┐
│                 ├─────────────────────────►│                         │
│  React Frontend │                          │  Backend (Laravel 11)   │
│                 │◄─────────────────────────┤  - Intervention Image   │
└─────────────────┘   JSON: URL / Signed URL └───────────┬─────────────┘
                                                         │
                                   AWS S3 Driver (PUT/GET/DELETE)
                                                         │
                                                         ▼
                                             ┌─────────────────────────┐
                                             │     Supabase Storage    │
                                             │  - Bucket: avatars      │
                                             │  - Bucket: evidences    │
                                             └─────────────────────────┘
```

- **Backend (Laravel)** bertindak sebagai perantara yang memvalidasi ukuran dan tipe MIME, mengompresi gambar, dan menentukan letak berkas.
- **Supabase Storage** bertindak sebagai *Object Storage* berbasis S3 untuk menyimpan aset statis tanpa membebani disk server utama.
- **Frontend (React)** menerima URL untuk menampilkan gambar atau berkas.

---

## 2. Klasifikasi Bucket: Public vs Private

Tidak semua berkas boleh dibuka ke publik. Sistem membagi penyimpanan menjadi 2 bucket:

| Kriteria | Bucket `avatars` | Bucket `evidences` |
| :--- | :--- | :--- |
| **Status Akses** | **Public** | **Private** |
| **Jenis File** | Foto profil / avatar pengguna | Bukti tugas harian, surat izin sakit/dokter, tanda tangan digital, stempel resmi |
| **Metode Akses** | Direct Public URL statis | S3 Pre-signed URL dinamis (`temporaryUrl`) |
| **Masa Aktif URL** | Permanen (Selamanya) | Sementara (15–20 Menit) |
| **Caching** | Browser & CDN Cache | Caching URL di Server (Redis/Cache 15 Menit) |
| **Alasan Keamanan** | Foto profil wajar dilihat publik/tim. | Menghindari kebocoran data medis, privasi izin, dan pemalsuan tanda tangan/stempel. |

---

## 3. Manajemen Kunci & Kredensial Supabase (S3 Keys)

### 3.1 Perbedaan Tipe Kunci di Supabase
Banyak pengembang keliru memasukkan kunci `anon` atau `service_role` ke konfigurasi S3 Laravel. Keduanya **berbeda**:

1. **Anon Key & Service Role Key**: Kunci berbasis JWT untuk REST API Supabase dan PostgREST.
2. **S3 Access Keys**: Kunci berbentuk *Access Key ID* dan *Secret Access Key* khusus untuk antarmuka AWS S3 kompatibel. **Ini yang wajib digunakan oleh driver Laravel Flysystem S3.**

### 3.2 Cara Menghasilkan S3 Access Key
1. Buka **Supabase Dashboard** ([supabase.com/dashboard](https://supabase.com/dashboard)).
2. Pilih proyek Anda.
3. Masuk ke **Project Settings** (ikon gerigi di kiri bawah) &rarr; pilih menu **Storage**.
4. Gulir ke bagian **S3 Access Keys**.
5. Klik **Generate new key**.
6. Simpan nilai yang muncul:
   - `Access Key ID`
   - `Secret Access Key`

### 3.3 Konfigurasi Environment (`.env` Backend)
Pastikan berkas `.env` pada folder `Backend/` memiliki konfigurasi berikut:

```env
# ==============================================================================
# SUPABASE STORAGE CONFIGURATION (S3 DRIVER)
# ==============================================================================
SUPABASE_STORAGE_DRIVER=s3
SUPABASE_STORAGE_KEY=masukkan_s3_access_key_id_di_sini
SUPABASE_STORAGE_SECRET=masukkan_s3_secret_access_key_di_sini
SUPABASE_STORAGE_REGION=ap-southeast-1

# Endpoint S3 (Wajib menyertakan /storage/v1/s3)
SUPABASE_STORAGE_ENDPOINT=https://<PROJECT_REF>.supabase.co/storage/v1/s3

# Base URL Objek Publik (Wajib menyertakan /storage/v1/object/public)
SUPABASE_STORAGE_URL=https://<PROJECT_REF>.supabase.co/storage/v1/object/public

# Definisi Nama Bucket
SUPABASE_STORAGE_BUCKET=evidences
SUPABASE_AVATARS_BUCKET=avatars
```

---

## 4. Panduan Troubleshooting URL Foto Profil (Avatar)

Jika foto profil pengguna tidak muncul, broken image, atau 404 Not Found, ikuti 6 langkah verifikasi berikut:

### Langkah 1: Pastikan Bucket `avatars` Bersifat Public
1. Di **Supabase Dashboard**, buka menu **Storage** &rarr; **Buckets**.
2. Cari bucket bernama `avatars`. Jika belum ada, buat bucket baru dengan nama `avatars`.
3. Klik titik tiga pada bucket `avatars` &rarr; pilih **Edit bucket**.
4. Aktifkan opsi **Public bucket**.
5. Klik **Save**.

### Langkah 2: Tambahkan RLS Policy untuk Izin Baca Publik
Secara default, tabel penyimpanan Supabase dilindungi Row Level Security (RLS). Jalankan perintah SQL ini di Supabase SQL Editor:

```sql
-- Berikan izin baca publik tanpa batas untuk bucket avatars
CREATE POLICY "Allow Public Read on Avatars" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'avatars');
```

### Langkah 3: Periksa Format Penyimpanan di `ProfileController.php`
Pastikan URL yang dibentuk tidak menduplikasi nama folder. 
Contoh yang **salah**:
`.../public/avatars/avatars/avatar_123.jpg` (karena nama bucket sudah `avatars` dan path file juga diberi prefix `avatars/`).

Implementasi yang **benar**:
```php
// app/Http/Controllers/ProfileController.php

$filename    = 'avatar_' . $user->id . '_' . time() . '.jpg';
$storagePath = $filename; // Simpan langsung di root bucket avatars

if (env('SUPABASE_STORAGE_KEY')) {
    Storage::disk('supabase_avatars')->put($storagePath, (string) $encodedImage);
    
    // Bentuk Public URL yang valid
    $avatarUrl = rtrim(env('SUPABASE_STORAGE_URL'), '/') . '/' . env('SUPABASE_AVATARS_BUCKET', 'avatars') . '/' . $storagePath;
} else {
    // Fallback Lokal jika Supabase mati/offline
    Storage::disk('public')->put('avatars/' . $storagePath, (string) $encodedImage);
    $avatarUrl = config('app.url') . Storage::url('avatars/' . $storagePath);
}

$user->update(['avatar_url' => $avatarUrl]);
```

### Langkah 4: Hindari Signed URL pada Model `User.php` untuk Avatar
Jika bucket berstatus **Public**, jangan gunakan `Storage::temporaryUrl()` pada accessor avatar di `User.php`. Signed URL memiliki masa kedaluwarsa, sehingga jika dicache oleh frontend, avatar akan kedaluwarsa setelah beberapa jam.

Kembalikan URL publik apa adanya:
```php
// app/Models/User.php
public function getAvatarUrlAttribute($value)
{
    // Jika null atau kosong, return null
    if (!$value) return null;

    // Untuk bucket public, langsung kembalikan URL statis
    return $value;
}
```

### Langkah 5: Pasang Graceful Fallback di Frontend (React)
Agar antarmuka tidak menampilkan icon gambar rusak (broken image) saat URL bermasalah, gunakan penanganan `onError`:

```jsx
// Frontend/src/components/layout/TopNav.jsx
const [imgError, setImgError] = useState(false);

{user?.avatar_url && !imgError ? (
  <img 
    src={user.avatar_url} 
    alt={user.full_name} 
    className="w-10 h-10 rounded-full object-cover border border-slate-200"
    onError={() => setImgError(true)} // Jika 404, fallback ke inisial
  />
) : (
  <div className="w-10 h-10 rounded-full bg-blue-500 text-white font-bold flex items-center justify-center">
    {user?.nickname ? user.nickname.charAt(0).toUpperCase() : "U"}
  </div>
)}
```

### Langkah 6: Pembersihan Data URL Rusak di Database
Jika masih ada URL lama yang mengarah ke `localhost` atau format path usang:

```sql
-- Reset avatar URL yang bermasalah di database
UPDATE profiles
SET avatar_url = NULL
WHERE avatar_url LIKE '%localhost%'
   OR avatar_url NOT LIKE 'https://%';

-- Perbaiki URL yang terlanjur memiliki duplikasi path /avatars/avatars/
UPDATE profiles
SET avatar_url = REPLACE(avatar_url, '/avatars/avatars/', '/avatars/')
WHERE avatar_url LIKE '%/avatars/avatars/%';
```

---

## 5. Mekanisme Penyimpanan Berkas Sensitif (Bukti, Izin, Tanda Tangan)

Untuk berkas di bucket `evidences` (Private), gunakan mekanisme **Pre-Signed URL dengan Caching**.

### 5.1 Alur Kerja Pre-signed URL
1. Berkas di-upload ke Supabase bucket privat `evidences`.
2. Di database `daily_tasks`, `exceptions`, atau `profiles` (untuk tanda tangan), simpan URL referensi atau path relatif berkas.
3. Saat data diambil via API, Model Accessor Laravel (`getEvidenceUrlAttribute`) otomatis membuat URL bertanda tangan S3 (`?X-Amz-Signature=...`) yang berlaku selama **20 menit**.
4. Untuk menghindari kalkulasi kriptografi berulang yang memperlambat API, URL yang dihasilkan **di-cache selama 15 menit** di server.

### 5.2 Implementasi Kode pada Model
```php
// app/Models/DailyTask.php & app/Models/Exception.php

public function getEvidenceUrlAttribute(?string $value): ?string
{
    if (!$value) return null;

    if (env('SUPABASE_STORAGE_KEY')) {
        $baseUrl = env('SUPABASE_STORAGE_URL');
        $bucket  = env('SUPABASE_STORAGE_BUCKET', 'evidences');
        
        if (str_contains($value, $baseUrl)) {
            $storagePath = str_replace($baseUrl . '/' . $bucket . '/', '', $value);
            
            try {
                $cacheKey = 'supabase_signed_url_' . md5($storagePath);
                
                // Cache 15 menit (900 detik), link berlaku 20 menit
                return Cache::remember($cacheKey, 900, function () use ($storagePath) {
                    return Storage::disk('supabase')->temporaryUrl($storagePath, now()->addMinutes(20));
                });
            } catch (\Exception $e) {
                return $value;
            }
        }
    }

    return $value;
}
```

---

## 6. Praktik Terbaik: Kompresi, Pembersihan & Fallback Offline

### A. Kompresi Gambar Otomatis (Intervention Image)
Sebelum file dikirim ke Supabase, backend wajib melakukan resize dan re-encoding untuk menghemat bandwidth dan kuota penyimpanan:
- **Avatar**: `cover(800, 800)`, encode JPEG quality 90%.
- **Bukti Tugas**: `scaleDown(width: 1200)`, encode JPEG quality 80%.
- **Tanda Tangan Digital**: `scaleDown(width: 600)`, encode PNG (mempertahankan transparansi).

### B. Garbage Collection (Hapus File Fisik saat Diganti/Dihapus)
Hindari file yatim (*orphaned files*) di storage. Saat pengguna mengganti tanda tangan atau menghapus tugas:
```php
if ($user->signature_url) {
    Storage::disk('supabase')->delete($user->signature_url);
}
```

### C. Fallback Local Development (Bekerja Offline)
Jika pengembang lokal tidak memiliki akun Supabase:
1. Kosongkan nilai `SUPABASE_STORAGE_KEY=` di `.env`.
2. Sistem otomatis mengalihkan penyimpanan ke driver lokal:
   `Storage::disk('public')->put(...)`
3. Berkas akan tersimpan di folder `Backend/storage/app/public/` dan dapat diakses melalui symbolic link `http://localhost:8000/storage/...`.

---

## 7. Matriks Diagnostik Cepat Masalah Storage

| Gejala Error | Kemungkinan Penyebab | Solusi Langsung |
| :--- | :--- | :--- |
| **HTTP 404 Not Found** saat buka URL di browser | 1. URL tidak memiliki segmen `/storage/v1/object/public/`<br>2. Duplikasi folder (`/avatars/avatars/`). | Perbaiki `SUPABASE_STORAGE_URL` di `.env` dan hilangkan prefix folder ganda di controller. |
| **HTTP 400 Bad Request** / **403 Forbidden** | Bucket di Supabase berstatus *Private* atau RLS belum mengizinkan public read. | Buka Supabase Dashboard &rarr; Storage &rarr; Edit Bucket &rarr; Centang **Public bucket**, atau buat RLS Policy untuk `SELECT`. |
| **URL gambar berfungsi sebentar, lalu error** | File privat menggunakan Signed URL yang sudah kedaluwarsa (expired token). | Pastikan Model Accessor men-generate Signed URL baru secara dinamis, atau ubah bucket ke Public jika memang ditujukan untuk avatar. |
| **Upload gagal: Invalid S3 Credentials** | Kunci yang dimasukkan adalah `anon` / `service_role` key, bukan S3 Access Key. | Buka Project Settings &rarr; Storage &rarr; S3 Access Keys &rarr; Generate new key. |
| **Tanda tangan digital latar belakangnya hitam** | File PNG di-encode sebagai JPEG saat di-upload sehingga channel transparansi hilang. | Gunakan `new PngEncoder()` saat memproses tanda tangan atau stempel. |
