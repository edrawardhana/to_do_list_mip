# Dokumentasi API: Universal Image Upload (Supabase Storage)

Endpoint ini digunakan untuk mengunggah gambar/foto secara langsung dari Frontend (webcam/folder) ke bucket `task_evidence` di Supabase, sebelum data tersebut di-submit ke tabel database `daily_tasks` (Logbook) atau `exceptions` (Izin Sakit).

---

## 📸 Endpoint: Upload Evidence Photo
Metode ini menerima file fisik gambar, menyimpannya ke Supabase S3, lalu membalas dengan link URL publik yang valid.

* **URL:** `/api/upload-evidence`
* **Method:** `POST`
* **Headers:**
  * `Authorization: Bearer <token_jwt>`
  * `Content-Type: multipart/form-data` *(Penting! Tidak boleh application/json)*

### 📝 Request Body (Form-Data)

| Key | Tipe | Wajib | Deskripsi |
| :--- | :--- | :---: | :--- |
| `evidence_file` | File | Ya | File gambar berformat **JPG/JPEG/PNG/WEBP**. Ukuran maksimal per file adalah **5MB**. |

> **Tips untuk Frontend (Nanda):** Jika teman-teman menggunakan `axios` atau `fetch`, pastikan file gambar dari kamera dimasukkan ke dalam objek `FormData` JavaScript bawaan, lalu dikirimkan ke backend.

**Contoh Payload JavaScript (Axios):**
```javascript
const formData = new FormData();
formData.append('evidence_file', fileRef.current.files[0]); // Atau data Blob dari kamera WebRTC

const response = await axios.post('/api/upload-evidence', formData, {
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
    }
});
```

### ✅ Success Response (201 Created)

Setelah Supabase sukses menyimpan gambarnya secara *streaming*, API akan mengembalikan public URL gambar tersebut. 
**URL inilah yang nantinya kalian kirimkan di payload JSON saat membikin/edit Logbook (`evidence_url`)**.

**Contoh Response:**
```json
{
    "status": "success",
    "message": "Gambar berhasil diunggah.",
    "data": {
        "evidence_url": "https://syvvhzdstzdcnehkzbik.supabase.co/storage/v1/object/public/task_evidence/evidence_167890_abc123.jpg"
    }
}
```

### ❌ Error Response

**1. Validasi Gagal (422 Unprocessable Entity)**
Terjadi jika tidak ada file yang dikirim, ukuran file >5MB, atau file bukan gambar (misal PDF).
```json
{
    "message": "The evidence file must be an image.",
    "errors": {
        "evidence_file": [
            "Ukuran gambar maksimal adalah 5MB."
        ]
    }
}
```

**2. Gagal Upload ke Supabase (500 Server Error)**
Terjadi jika storage server down atau keys credentials di deployment bermasalah.
```json
{
    "status": "error",
    "message": "Gagal mengunggah gambar ke server Supabase Storage."
}
```

---

## 💡 Alur Eksekusi (Workflow) bagi Tim Frontend:
Agar database tetap rapi (*RESTful JSON* murni dan *stateless*), berikut adalah urutan *logic* yang wajib diikuti oleh fungsionalitas submit Logbook / Sakit di React:

1. **Step 1:** User menekan tombol "Ambil Foto" (WebRTC / Choose File).
2. **Step 2:** Begitu user menekan tombol "Submit Logbook":
   * Frontend diam-diam mengirim form-data foto itu sendirian ke `/api/upload-evidence`.
   * Tunggu balasan URL gambar dari `data.evidence_url` ini.
3. **Step 3:** Jika Step 2 sukses, barulah Frontend men-*trigger* POST request utama ke `/api/daily-tasks` seperti biasa (menggunakan *JSON body*) sambil menyisipkan `data.evidence_url` dari langkah 2 ke field `evidence_url` di JSON payload.
4. **Step 4:** Tugas selesai, Backend menghubungkan seluruh relasi logbook di Database Supabase.
