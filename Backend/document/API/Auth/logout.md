# Logout User PANDUAN LENGKAP 🚀

Ini adalah dokumentasi khusus untuk tombol **Keluar / Sign Out**.

---

## 🔗 Endpoint Info
- **URL**: `POST /api/auth/logout`
- **Auth**: **WAJIB pakai Token (Bearer)**

---

## Kenapa Harus Tembak API Logout?
Secara teknis teori Frontend murni, logout itu sekadar menghapus "Token" dari *LocalStorage* browser saja.
TAPI, untuk keamanan *(Security)* yang bagus, Frontend **HARUS memberitahu Backend** bahwa pengguna ini minta keluar. Supaya Backend bisa langsung **MENGHANGUSKAN (Revoke)** tiket Token JWT tersebut secara permanen di mata server.

## 📌 Headers Wajib di Axios (WAJIB BAWA TOKEN)
Karena ini adalah area rahasia *(Private Route)*, Backend harus tahu **SIAPA** yang minta logout. Caranya adalah dengan memastikan Frontend menyisipkan tiket token Karyawan di *Header Authorization*:

```json
{
    "Accept": "application/json",
    "Authorization": "Bearer isi_token_jwt_yang_ada_di_localstorage"
}
```
> *Ganti isi_token_jwt... dengan token asli.*

---

## ✅ Response Sukses dari Backend (HTTP 200 OK)

Jika Backend sukses menghanguskan tokennya, dia membalas:
```json
{
    "message": "Successfully logged out"
}
```

> **🔥 TUGAS SANGAT PENTING UNTUK FRONTEND:**
> Setelah mendapat balasan Sukses ini, Frontend **WAJIB menghapus** JWT Token tersebut dari *LocalStorage* Javascript. Lalu menendang *"redirect"* layarnya kembali ke halaman Login!

---

## ❌ Response Kalau Gagal (HTTP 401 Unauthorized)
Kalau tokennya kosong, salah, atau memang sudah kadaluarsa (expired), Backend akan membalas 401.

---

## 💻 Contoh Kodingan Axios di React (Buat Contekan FE)

```javascript
import axios from 'axios';

const handleLogoutClick = async () => {
  try {
    // 1. AMBIL TOKEN DARI LOCALSTORAGE
    const token = localStorage.getItem('jwt_token');

    // 2. TEMBAK API LOGOUT BESERTA TOKEN-NYA
    await axios.post('http://localhost:8000/api/auth/logout', {}, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}` // SELALU ISI INI!
      }
    });

    console.log("Backend sukses menghapus sesi Token!");

  } catch (error) {
    console.log("Error API Logout, tapi gak apa-apa kita paksa logout di Frontend saja.");
  } finally {
    // 3. (WAJIB) HAPUS TOKEN DARI MEMORI BROWSER
    localStorage.removeItem('jwt_token');
    
    // 4. (WAJIB) TENDANG KARYAWAN KEMBALI KE HALAMAN LOGIN
    alert("Berhasil keluar dengan aman!");
    // window.location.href = '/login'; ATAU navigate('/login');
  }
};
```
