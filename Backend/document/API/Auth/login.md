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

## ❌ Response Kalau Belum Di-ACC Admin (HTTP 403 Forbidden)

Jika password sudah benar, tapi akun Karyawan **masih dikunci oleh Admin (is_locked: true)**, Backend akan memblokir login dengan pesan khusus:
```json
{
    "error": "Akun Anda masih dikunci. Hubungi Admin untuk persetujuan."
}
```

---

## ❌ Response Kalau Input Kosong (HTTP 422 Unprocessable Entity)

Jika Frontend lupa mengirim email atau password sama sekali, Backend akan membalas error `422` beserta detail mana input yang kurang (sama seperti sifat form API Register).

---

## ❌ Response Kalau Email/Password Salah (HTTP 401 Unauthorized)

Kalau Karyawan **salah ketik password**, ATAU **emailnya belum pernah terdaftar**, Backend akan menolak mentah-mentah dengan pesan `401 Unauthorized`.

```json
{
    "error": "Unauthorized"
}
```

**Saran Untuk Frontend:** Tangkap respons error spesifik ini di `try-catch` Axios kamu untuk memberi tahu Karyawan secara akurat (apakah salah password, dikunci admin, atau email kosong).

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
    if (error.response) {
      if (error.response.status === 401) alert("Email atau Password salah!");
      else if (error.response.status === 403) alert(error.response.data.error); // "Akun Anda masih dikunci..."
      else if (error.response.status === 422) alert("Harap isi email dan password dengan benar.");
    } else {
      alert("Terjadi kesalahan koneksi server.");
    }
  }
};
```
