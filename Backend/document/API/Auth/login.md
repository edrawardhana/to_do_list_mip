# Login User PANDUAN LENGKAP 🚀

Ini adalah dokumentasi khusus untuk halaman **Sign In / Masuk** ke dalam aplikasi.
Sama seperti Register, tolong ikuti panduan ini pelan-pelan ya!

---

## 🔗 Endpoint Info
- **URL**: `POST /api/auth/login`
- **Auth**: Bebas akses (TIDAK butuh Token)

---

## 📦 Apa Saja Yang Harus Dikirim Frontend? (Body Request JSON)

Frontend hanya perlu mengirimkan **2 data** ini ke Backend. Pastikan *penamaan key-nya* sama persis:

```json
{
    "email": "admin@mcc.com",
    "password": "password123"
}
```

### 📋 Penjelasan:
- **`email`**: Email yang sudah didaftarkan sebelumnya.
- **`password`**: Password dari akun tersebut.

---

## 📌 Headers Wajib di Axios
Pastikan Axios membawa header murni JSON:
```json
{
    "Accept": "application/json",
    "Content-Type": "application/json"
}
```

---

## ✅ Response Sukses dari Backend (HTTP 200 OK)

Jika Email dan Password **BENAR**, Backend akan membalas dengan memberikan *"Kunci Pas"* rahasia yang disebut **Token (JWT)**.

```json
{
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9... (huruf acak sangat panjang)",
    "token_type": "bearer",
    "expires_in": 3600
}
```

> **🔥 TUGAS SANGAT PENTING UNTUK FRONTEND:**
> Kamu (Frontend) **WAJIB** menangkap `access_token` ini dan menyimpannya ke dalam **LocalStorage** atau **Cookies** browser Karyawan. Token inilah yang menjadi "Tiket Masuk" untuk Karyawan bisa membuka halaman Dashboard dan menarik data-data Divisi nantinya!

---

## ❌ Response Kalau Terjadi Error / Gagal (HTTP 401 Unauthorized)

Kalau Karyawan **salah ketik password**, ATAU **emailnya belum pernah terdaftar**, Backend akan menolak mentah-mentah dengan pesan `401 Unauthorized`.

```json
{
    "error": "Unauthorized"
}
```

Selain itu, jika akun Karyawan tersebut **masih dikunci oleh Admin (is_locked: true)**, Backend juga mungkin akan memblokir login-nya!

**Saran Untuk Frontend:** Tangkap merespons status `401` di `try-catch` Axios kamu dan munculkan Alert: *"Email atau Password Salah!"*

---

## 💻 Contoh Kodingan Axios di React (Buat Contekan FE)

```javascript
import axios from 'axios';

const handleLoginSubmit = async (formData) => {
  try {
    const response = await axios.post('http://localhost:8000/api/auth/login', {
      email: formData.email,
      password: formData.password
    }, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    console.log("Berhasil Login!");
    
    // 1. TANGKAP TOKEN DARI BACKEND
    const token = response.data.access_token;
    
    // 2. SIMPAN TOKEN KE LOCALSTORAGE BROWSER! (PENTING BANGET)
    localStorage.setItem('jwt_token', token);

    alert("Login Sukses! Selamat datang.");
    
    // 3. Arahkan / Redirect karyawan masuk ke halaman Dashboard Utama
    // navigate('/dashboard');

  } catch (error) {
    if (error.response && error.response.status === 401) {
      alert("Email atau Password salah! Atau akun belum di-ACC Admin.");
    } else {
      alert("Terjadi kesalahan server.");
    }
  }
};
```
