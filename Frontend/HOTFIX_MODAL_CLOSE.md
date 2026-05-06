# Hotfix - Modal Tidak Tertutup Setelah Submit

## 📅 Tanggal: 2026-05-06

## 🐛 Masalah

**Error:** Modal tetap terbuka setelah submit laporan berhasil.

**Penyebab:** `LiveCameraModal` tidak menutup diri sendiri setelah `onSubmit` selesai. Parent (`InternTasks`) sudah memanggil `handleCloseCamera()`, tapi modal tidak tahu kapan submit selesai.

## ✅ Solusi

### Opsi 1: Parent yang Kontrol (DIPILIH)

Modal hanya submit data, parent yang bertanggung jawab menutup modal setelah sukses.

**File:** `Frontend/src/pages/intern/InternTasks.jsx`

```javascript
const handleSubmitReport = async (submittedData) => {
  const taskId = selectedTask?.id;
  if (!taskId) {
    toast.error("ID tugas tidak ditemukan.");
    return;
  }

  try {
    await api.post(`/daily-tasks/${taskId}/submit`, submittedData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    toast.success("Laporan berhasil dikirim! Menunggu persetujuan admin.");
    
    // ✅ Tutup modal setelah sukses
    handleCloseCamera();
    
    // Refresh data
    fetchTasks();
  } catch (err) {
    const msg = err.response?.data?.message || "Gagal mengirim laporan.";
    toast.error(msg);
  }
};
```

**File:** `Frontend/src/components/ui/LiveCameraModal.jsx`

```javascript
const handleSubmit = async () => {
  if (!hasImage) return;
  if (!description.trim()) {
    alert("Catatan pelaksanaan tidak boleh kosong.");
    return;
  }
  setIsLoading(true);
  try {
    // ... compress & build FormData ...

    // ✅ onSubmit bertanggung jawab menutup modal setelah sukses
    await onSubmit(formData);

  } catch (error) {
    console.error("Gagal kirim:", error);
    if (!error._handled) {
      alert("Terjadi kesalahan, coba lagi.");
    }
  } finally {
    setIsLoading(false);
  }
};
```

### Opsi 2: Modal yang Kontrol (TIDAK DIPILIH)

Modal menutup diri sendiri setelah `onSubmit` selesai.

```javascript
// Di LiveCameraModal
await onSubmit(formData);
onClose(); // ❌ Bisa double close jika parent juga memanggil
```

**Masalah:** Jika parent juga memanggil `handleCloseCamera()`, modal akan ditutup dua kali (tidak masalah secara fungsional, tapi tidak clean).

## 🎯 Keputusan

**Pilih Opsi 1** — Parent yang kontrol penutupan modal karena:
- ✅ Parent tahu kapan submit sukses (setelah API response)
- ✅ Parent bisa refresh data sebelum tutup modal
- ✅ Parent bisa tampilkan toast notification
- ✅ Lebih clean — single source of truth

## 🧪 Testing

1. Login sebagai intern
2. Buka halaman Tasks
3. Klik tombol kamera pada tugas
4. Ambil foto atau upload file
5. Isi deskripsi
6. Klik "Kirim Laporan"
7. **Expected:** Modal tertutup otomatis setelah toast "Laporan berhasil dikirim!"

## 📝 Flow Diagram

```
User klik "Kirim Laporan"
  ↓
LiveCameraModal.handleSubmit()
  ↓
Compress image
  ↓
Build FormData
  ↓
await onSubmit(formData)  ← Call parent handler
  ↓
InternTasks.handleSubmitReport()
  ↓
POST /api/daily-tasks/{id}/submit
  ↓
Success? → toast.success() → handleCloseCamera() → Modal tertutup ✅
  ↓
Error? → toast.error() → Modal tetap terbuka (user bisa retry)
```

---

**Status:** ✅ FIXED
