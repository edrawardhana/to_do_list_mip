# Panduan Intern: Upload Gambar Bukti Daily Task

## 📋 Overview

Sebagai Intern, Anda dapat mengirim laporan Daily Task (Logbook) dengan melampirkan gambar bukti. Gambar akan **otomatis dikompres** untuk menghemat storage dan mempercepat loading.

## 📸 Cara Upload Gambar Bukti

### 1. Submit Daily Task dengan Gambar

**Endpoint:** `POST /api/daily-tasks/{id}/submit`

**⚠️ PENTING:** Gunakan endpoint ini untuk upload gambar, bukan endpoint PUT!

**Headers:**
```
Authorization: Bearer {your_intern_token}
Content-Type: multipart/form-data
```

**Body (Form Data):**
- `description` (required): Deskripsi progress tugas Anda
- `evidence_url` (optional): File gambar bukti

**Spesifikasi Gambar:**
- Format: JPEG, JPG, PNG, GIF, WEBP
- Ukuran maksimal: 10 MB
- Resolusi: Bebas (akan otomatis diresize jika terlalu besar)

### 2. Contoh Request (cURL)

```bash
curl -X POST "http://localhost:8000/api/daily-tasks/550e8400-e29b-41d4-a716-446655440000/submit" \
  -H "Authorization: Bearer {your_token}" \
  -F "description=Menyelesaikan modul login dan registrasi. Progress 80%." \
  -F "evidence_url=@/path/to/your/photo.jpg"
```

### 3. Contoh Request (JavaScript/Fetch)

```javascript
const submitTask = async (taskId, description, imageFile) => {
  const formData = new FormData();
  formData.append('description', description);
  
  if (imageFile) {
    formData.append('evidence_url', imageFile);
  }
  
  const response = await fetch(
    `${API_URL}/api/daily-tasks/${taskId}/submit`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
        // Jangan set Content-Type, browser akan set otomatis untuk FormData
      },
      body: formData
    }
  );
  
  return await response.json();
};

// Usage
const fileInput = document.getElementById('photo-input');
const file = fileInput.files[0];

submitTask(
  'task-uuid-here',
  'Progress selesai 80%',
  file
).then(result => {
  console.log('Success:', result);
});
```

### 4. Contoh Request (React)

```jsx
import { useState } from 'react';

const TaskSubmitForm = ({ taskId }) => {
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validasi ukuran file (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('Ukuran file maksimal 10MB');
        return;
      }
      
      // Validasi tipe file
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        alert('Format file harus JPEG, PNG, GIF, atau WEBP');
        return;
      }
      
      setImage(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append('description', description);
    
    if (image) {
      formData.append('evidence_url', image);
    }

    try {
      const response = await fetch(
        `${API_URL}/api/daily-tasks/${taskId}/submit`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: formData
        }
      );

      const result = await response.json();
      
      if (result.status === 'success') {
        alert('Laporan berhasil dikirim!');
        setDescription('');
        setImage(null);
      } else {
        alert('Error: ' + result.message);
      }
    } catch (error) {
      alert('Terjadi kesalahan: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Deskripsi Progress:</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          placeholder="Jelaskan progress tugas Anda..."
        />
      </div>

      <div>
        <label>Foto Bukti:</label>
        <input
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
          onChange={handleImageChange}
        />
        {image && <p>File dipilih: {image.name}</p>}
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Mengirim...' : 'Kirim Laporan'}
      </button>
    </form>
  );
};
```

### 5. Response Success

```json
{
  "status": "success",
  "message": "Laporan berhasil dikirim. Menunggu persetujuan Admin.",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "description": "Menyelesaikan modul login dan registrasi. Progress 80%.",
    "evidence_url": "/storage/task_evidence/task_550e8400_1729000000.jpg",
    "status": "pending",
    "updated_at": "2026-10-14T10:30:00Z"
  }
}
```

### 6. Response Error

**Error: File terlalu besar**
```json
{
  "message": "The evidence url must not be greater than 10240 kilobytes.",
  "errors": {
    "evidence_url": [
      "The evidence url must not be greater than 10240 kilobytes."
    ]
  }
}
```

**Error: Format file tidak valid**
```json
{
  "message": "The evidence url must be a file of type: jpeg, jpg, png, gif, webp.",
  "errors": {
    "evidence_url": [
      "The evidence url must be a file of type: jpeg, jpg, png, gif, webp."
    ]
  }
}
```

**Error: Task sudah di-approve**
```json
{
  "status": "error",
  "message": "Tugas sudah di-ACC dan tidak dapat diubah."
}
```

## 🖼️ Kompresi Gambar Otomatis

### Apa yang Terjadi dengan Gambar Anda?

Saat Anda upload gambar, sistem akan **otomatis**:

1. ✅ **Mengkonversi ke JPEG** - Format paling efisien
2. ✅ **Mengompres dengan kualitas 80%** - Balance antara ukuran dan kualitas
3. ✅ **Meresize jika terlalu besar** - Max width 1920px
4. ✅ **Menjaga aspect ratio** - Proporsi gambar tetap sama
5. ✅ **Menghapus gambar lama** - Jika Anda upload ulang

### Contoh Hasil Kompresi

**Sebelum Upload:**
- File: `IMG_20261014_103045.png`
- Ukuran: 5.2 MB
- Dimensi: 4000x3000px

**Setelah Upload:**
- File: `task_550e8400_1729000000.jpg`
- Ukuran: ~800 KB (85% lebih kecil!)
- Dimensi: 1920x1440px
- Kualitas: Tetap bagus dan jelas

### Keuntungan untuk Anda

✅ **Upload Lebih Cepat** - File lebih kecil = upload lebih cepat  
✅ **Hemat Kuota** - Menghemat kuota internet Anda  
✅ **Tidak Perlu Edit Manual** - Sistem otomatis kompres  
✅ **Kualitas Tetap Bagus** - Admin tetap bisa lihat dengan jelas  

## 🔒 Aturan Evidence Lock

### ⚠️ PENTING: Foto Tidak Bisa Diubah Setelah Upload!

Setelah Anda upload foto bukti **pertama kali**, foto tersebut akan **dikunci** dan tidak bisa diubah lagi oleh Anda.

### Kenapa Ada Aturan Ini?

- Mencegah manipulasi bukti
- Menjaga integritas data
- Audit trail yang jelas

### Apa yang Terjadi Jika Saya Coba Upload Ulang?

Anda akan mendapat error:

```json
{
  "status": "error",
  "message": "Bukti foto sudah dikunci permanen oleh sistem dan tidak dapat diubah lagi. Hubungi Admin Jika ada keliruan.",
  "system_error": "TRIGGER_EVIDENCE_LOCK"
}
```

### Bagaimana Jika Saya Salah Upload?

Jika Anda salah upload foto:

1. **Hubungi Admin Divisi Anda**
2. Jelaskan kesalahannya
3. Admin bisa membantu update foto yang benar

## 📱 Tips Upload Gambar

### 1. Ambil Foto yang Jelas

✅ **DO:**
- Pastikan pencahayaan cukup
- Fokus pada objek yang ingin difoto
- Ambil dari jarak yang tepat
- Pastikan tidak blur

❌ **DON'T:**
- Foto terlalu gelap
- Foto blur atau tidak fokus
- Foto terlalu jauh sehingga tidak jelas

### 2. Ukuran File

- **Optimal:** 1-5 MB
- **Maksimal:** 10 MB
- Jika file terlalu besar, kompres dulu sebelum upload (atau biarkan sistem kompres otomatis)

### 3. Format File

**Direkomendasikan:**
- JPEG/JPG (paling efisien)
- PNG (untuk screenshot)

**Juga Diterima:**
- GIF
- WEBP

### 4. Resolusi

- **Minimal:** 800x600px (agar jelas)
- **Optimal:** 1920x1080px
- **Maksimal:** Bebas (akan diresize otomatis)

### 5. Konten Foto

✅ **Foto yang Baik:**
- Screenshot progress coding
- Foto hasil kerja
- Foto meeting/diskusi
- Foto dokumentasi

❌ **Hindari:**
- Foto yang tidak relevan
- Foto yang mengandung informasi sensitif
- Foto yang tidak profesional

## 🚨 Troubleshooting

### Error: "The evidence url must be an image"

**Problem:** File yang diupload bukan gambar

**Solution:**
- Pastikan file berformat JPEG, PNG, GIF, atau WEBP
- Jangan upload PDF, DOC, atau file lainnya

### Error: "The evidence url must not be greater than 10240 kilobytes"

**Problem:** File terlalu besar (>10MB)

**Solution:**
1. Kompres gambar dulu menggunakan tools online:
   - TinyPNG (https://tinypng.com)
   - Compressor.io (https://compressor.io)
2. Atau resize gambar ke resolusi lebih kecil
3. Atau ambil foto dengan kualitas lebih rendah

### Upload Gagal Terus

**Problem:** Upload selalu gagal

**Solution:**
1. Cek koneksi internet
2. Cek ukuran file (<10MB)
3. Cek format file (JPEG/PNG/GIF/WEBP)
4. Coba refresh browser
5. Coba clear cache browser
6. Hubungi admin jika masih gagal

### Foto Tidak Muncul Setelah Upload

**Problem:** Upload success tapi foto tidak muncul

**Solution:**
1. Refresh halaman
2. Cek response API, pastikan ada `evidence_url`
3. Coba akses URL langsung di browser
4. Hubungi admin jika masih bermasalah

## 📞 Support

Jika ada masalah atau pertanyaan, hubungi:
- Admin Divisi Anda
- Developer Team
- Email: developer@mip.co.id

## 📚 Referensi

- [API Documentation - Daily Tasks](./API/DailyTasks.md)
- [Admin Review Guide](./ADMIN_REVIEW_GUIDE.md)
