# Workflow Frontend: Camera & Data Tasks Integrasi

Dokumen ini memaparkan tentang peralihan drastis pada arsitektur web Frontend (`Tasks.jsx` dan `CameraModal.jsx`) dalam rangka mengatasi error _PostgreSQL UUID 500_ dan pelanggaran *Row Level Security* (RLS) Supabase-JS.

## Logika Refactoring "Tasks.jsx"

### Dari (Before)
Sistem Tasks menggunakan `const taskList = [{id: 1, ...}]` sebagai data *Dummy*. ID Tugas direpresentasikan sebagai _Integer Bulat_ standar.

### Menjadi (After)
1. **Fetching Real-Time via Axios**: Metode *mapping* Tabel sekarang didapatkan otomatis pada saat komponen di-load pertama kali (didapat dari *state* `[]` yang diisi pasca-`fetchTasks()`).
2. **Kesesuaian UUID PostgreSQL**: Karenanya, `task.id` yang di-*parsing* ke dalam CameraModal adalah ID UUID sepanjang 36 karakter (misal: `550e84...`). Hal ini mematuhi ketat tipe tabel `daily_tasks`.

## Alur Kamera Mode "Axios-Gateway" (`CameraModal.jsx`)

Kamera WebRTC (dengan *browser-image-compression*) tidak lagi dikunci dengan pustaka `supabaseClient.js`, melainkan langsung bertukar daya dengan Endpoint Laravel milik kita (yang memiliki protokol JWT ganda).
Protokol ini berjalan **2 tahap sekuensial**:

### Tahap 1: Upload (FormData)
```javascript
const formData = new FormData();
formData.append("evidence_file", compressedFile);

// 1. Eksekusi pengunggahan foto dari Blob kamera ke S3 Gateway `UploadController`
const uploadResponse = await axios.post(`${VITE_API_URL}/upload-evidence`, formData, { ...jwtHeaders });
```

### Tahap 2: Menghubungkan Foto (Update Logbook SQL Database)
```javascript
const publicUrl = uploadResponse.data.data.evidence_url;

// 2. Mengubah status *Approval* Logbook sesuai UUID Tugasnya
await axios.put(`${VITE_API_URL}/daily-tasks/${task.id}`, {
    evidence_url: publicUrl,
    status: "pending", // Akan diverifikasi Admin kelak
}, { ...jwtHeaders });
```

## Tips UI/UX dan Error Handling
* Kami memindahkan validasi S3 Extension File agar sistem Laravel Backend sendiri yang **menebak ekstensi** fotonya. Alhasil, bilamana Plugin Rekaman/Kamera WebRTC Anda mengganti formasi Blob Image jadi tak terdefinisi, foto Anda akan konsisten otomatis berekstensikan `.jpg` sehingga langsung bisa ter-preview dan ter-download pada dashboard website kita.
* Pastikan token JWT tidak *Expired* saat memanggil fungsi pengunggahan ya!
