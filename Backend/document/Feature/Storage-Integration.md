# Storage Integration Architecture (Supabase S3)

## Latar Belakang
Pada arsitektur awal, Frontend langsung berkomunikasi dengan Supabase Storage menggunakan Javascript (`supabase-js` client). Hal ini menyebabkan masalah kompabiltas keamanan, karena tabel `daily_tasks` diamankan melalui Laravel JWT Authentication. Hal ini memicu _Row Level Security_ (RLS) _Access Denied 403_ pada sistem Storage dan Database.

Untuk mengatasi ini, seluruh _logic upload_ dialihkan melalui Backend agar Backend bertindak sebagai jembatan tunggal (Gateway) yang terproteksi oleh JWT Auth.

## Arsitektur Alur Upload
Berikut adalah alur bagaimana file foto disalurkan melalui Backend Laravel ke Bucket Supabase:

1. **Frontend Request**: Klien murni menembakkan HTTP `POST /api/upload-evidence` berisikan Token Authorization (JWT). Klien wajib melampirkan file foto (`evidence_file`) dalam format Form Data (`multipart/form-data`).
2. **Laravel Validation**: Controller `UploadController@uploadEvidence` mendeteksi MIME Type dari file dan membatasi ukuran sampai rasio 5MB.
3. **Stream Upload**: Backend menggunakan driver pihak ketiga `league/flysystem-aws-s3-v3` yang ditambahkan pada `config/filesystems.php` (tepatnya pada *Disk* `supabase`). Laravel membuka stream secara langsung ke URI S3 Storage Supabase dan mengunggahnya.
4. **Generate URL URL**: Sistem membalikkan URL file aslinya untuk dipanggil oleh layanan manapun.
5. **Database Update**: Klien React mengambil string *public url* tersebut lalu memanggil `/api/daily-tasks/{id}` menggunakan metode `PUT` agar kolom `evidence_url` pada PostgreSQL terisi.

## Persiapan Environment Variables (`.env`)
Pastikan variabel terkait Amazon S3 / Supabase Storage berikut telah di-set dengan cermat:

```env
# URL Root milik layanan Supabase (contoh: https://syvvhzdstzdcnehkzbik.supabase.co)
SUPABASE_URL=

# Spesifik endpoint API Storage S3 dari Dashboard Supabase Anda
SUPABASE_ENDPOINT=https://syvvhzdstzdcnehkzbik.storage.supabase.co/storage/v1/s3
SUPABASE_BUCKET=task_evidence
SUPABASE_REGION=ap-southeast-1

# Akses Key bisa dicek & didapatkan di: 
# Supabase Panel -> Project Settings -> Storage -> S3 Connection
SUPABASE_ACCESS_KEY_ID=
SUPABASE_SECRET_ACCESS_KEY=
```

## Referensi Dependensi
- File Konfigurasi: `config/filesystems.php` (`'supabase' => [...]`)
- Controller Eksekusi: `app/Http/Controllers/UploadController.php`
- Routing: `routes/api.php` (`Route::post('/upload-evidence')`)

---

> **PENTING**:
> Karena S3 Supabase rentan terhadap _Silent Fail_ (Sistem Storage gagal nge-*throw Exception* jika _Access Key_ salah), perhatikan baik-baik balasan Frontend saat sistem _S3 Connection_ gagal (URL yang dikembalikan biasanya rusak/blank, dan menumpuk pada Bucket Storage jika _Storage Limit Exceeded_ terjadi. Cek kembali `.env` bilamana terdapat kendala ekstensi file nol).
