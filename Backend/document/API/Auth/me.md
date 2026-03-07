# Cek Profil Karyawan (Me) PANDUAN LENGKAP 🚀

Ini adalah dokumentasi khusus untuk mengambil data profil karyawan yang saat ini sedang Login. 
Backend butuh tahu profil siapa yang mau ditarik, makanya **WAJIB pakai Token**.

---

## 🔗 Endpoint Info
- **URL**: `GET /api/auth/me`
- **Auth**: **WAJIB pakai Token (Bearer)**

---

## Buat Apa Sih Endpoint Ini di Frontend?
Fungsi utama endpoint ini di React ada 3:
1. **Verifikasi Sesi:** Tiap kali nge-refresh web, cek apakah Token di *LocalStorage* masih aktif atau sudah kadaluarsa (Expired).
2. **Naruh Nama Profil:** Untuk nampilin tulisan "Halo, Kevin" di Pojok Kanan Atas menu navigasi.
3. **Mengecek Role (PENTING!):** Frontend bisa narik tulisan role dari sini (misal: "user" atau "super_admin"). Dari role ini, kodingan Frontend bisa memutuskan apakah Karyawan ini boleh lihat tombol "Approve Karyawan Baru" atau tidak.

---

## 📌 Headers Wajib di Axios (Bawa Tokennya!)
Karena minta data pribadi, Frontend wajib melampirkan "Tiket" (Token JWT) di header:

```json
{
    "Accept": "application/json",
    "Authorization": "Bearer isi_token_jwt_yang_ada_di_localstorage"
}
```

---

## ✅ Response Sukses dari Backend (HTTP 200 OK)

Jika Tokennya valid dan belum basi, Backend akan mengembalikan seisi biodata Karyawan tersebut:
```json
{
    "id": "019cc1... (id Karyawan)",
    "full_name": "Kevin Pratama",
    "email": "kevin@mcc.com",
    "username": "kevinpr",
    "role": "user",
    "shift": "pagi",
    "division_id": "019... (id divisinya dia)",
    "is_locked": false
}
```

---

## ❌ Response Kalau Gagal (HTTP 401 Unauthorized)
Kalau Tokennya kosong, atau sudah *Expired* (biasanya kadaluarsa setelah 60 menit), Backend akan membalas 401.

**Tugas Frontend:** Kalau nge-GET profil dapat balasan 401, kodingan Frontend **WAJIB langsung nge-Redirect (nendang)** layar komputernya balik ke halaman Login, karena artinya sesi main dia sudah habis!

---

## 💻 Contoh Kodingan Axios di React (Buat Contekan FE)

```javascript
import axios from 'axios';
import { useEffect, useState } from 'react';

// Contoh dipasang di dalam useEffect saat pertama kali render Dashboard
const fetchMyProfile = async () => {
  try {
    const token = localStorage.getItem('jwt_token');

    // Karena ini minta data, pakai GET bukan POST
    const response = await axios.get('http://localhost:8000/api/auth/me', {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}` // SELALU ISI INI!
      }
    });

    console.log("Profil Sukses Ditarik:", response.data);
    
    // Simpan ke State React untuk ditampilin di layar
    // setUserName(response.data.full_name);
    // setUserRole(response.data.role);

  } catch (error) {
    console.log("Token kayaknya udah basi, kembalikan user ke Login");
    
    // Hapus sisa token yang udah basi
    localStorage.removeItem('jwt_token');
    
    // Tendang ke luar
    // navigate('/login');
  }
};
```
