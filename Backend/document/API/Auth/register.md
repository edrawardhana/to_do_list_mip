# Register User Baru PANDUAN LENGKAP 🚀

Ini adalah dokumentasi khusus untuk halaman **Sign Up / Pendaftaran Karyawan Baru**.
Baca ini pelan-pelan ya supaya integrasi FE ke BE-nya lancar!

---

## 🔗 Endpoint Info
- **URL**: `POST /api/auth/register`
- **Auth**: Bebas akses (TIDAK butuh Token)

---

## 📦 Apa Saja Yang Harus Dikirim Frontend? (Body Request JSON)

Frontend harus mengirimkan **5 data** ini ke Backend. Pastikan *penamaan key-nya (kiri)* **sama persis** huruf kecil semua seperti di bawah ini, karena Backend akan mengecek namanya:

```json
{
    "full_name": "Kevin Pratama",
    "username": "kevinpr",
    "email": "kevin@mcc.com",
    "password": "password123",
    "password_confirmation": "password123",
    "division_id": "019cc113-95bf-712f-b4ba-111111111111"
}
```

### 📋 Penjelasan & Syarat Wajib Masing-Masing Data (Validation Rules):
1. **`full_name`**: Wajib diisi (string).
2. **`username`**: Wajib diisi (string).
3. **`email`**: Wajib berbentuk email (pakai `@`) dan **harus unik** (belum pernah terdaftar di database). Kalau email sudah dipakai orang lain, Backend akan menolak.
4. **`password`**: Wajib diisi, dan panjangnya **MINIMAL 8 KARAKTER**. (Tolong tambahkan juga validasi ini di layout Frontend ya!).
5. **`password_confirmation`**: Kolom ini didapat dari inputan *Ulangi Password*. Isi kolom ini **WAJIB SAMA PERSIS** dengan isi kolom `password`. Kalau tidak sama (typo/salah ketik), Backend akan langsung menolak pendaftaran.
6. **`division_id`**: Ini didapatkan dari Dropdown Divisi. *(Baca cara bikin dropdown-nya di file `divisions.md` berkat `GET /api/divisions`)*. Frontend hanya perlu mengirimkan *UUID yang acak* tersebut, BUKAN nama divisinya.

---

## 📌 Headers Wajib di Axios
Pastikan Axios kamu membawa header ini murni JSON:
```json
{
    "Accept": "application/json",
    "Content-Type": "application/json"
}
```

---

## ✅ Response Sukses dari Backend (HTTP 201 Created)

Jika semua data benar dan berhasil masuk database, Backend akan membalas begini:
```json
{
    "message": "User successfully registered. Please wait for admin approval.",
    "user": {
        "full_name": "Kevin Pratama",
        "email": "kevin@mcc.com",
        "username": "kevinpr",
        "role": "user",
        "division_id": "019cc113-95bf-712f-b4ba-111111111111",
        "is_locked": true,
        "id": "uuid-otomatis-baru-dari-database"
    }
}
```

> **Ingat:** Karyawan yg baru mendaftar **TIDAK BISA LANGSUNG LOGIN**! Status akun mereka adalah `is_locked: true`. Mereka harus ngantri menuggu *SuperAdmin* mengklik tombol "Approve" (ACC) dari halaman Dashboard Admin nantinya.

---

## ❌ Response Kalau Terjadi Error / Gagal (HTTP 422 Unprocessable Entity)

Nah, kalau Frontend salah mengirim data (contohnya: email sudah terdaftar, atau password kurang dari 8 karakter, atau password konfirmasi tidak cocok), Backend akan membalas dengan status 422 dan pesan error yang spesifik.

Contoh jika Frontend mengirim Password cuma 5 huruf:
```json
{
    "password": [
        "The password must be at least 8 characters."
    ]
}
```

Contoh jika Frontend mengirim Email yang sudah dipakai karyawan lain:
```json
{
    "email": [
        "The email has already been taken."
    ]
}
```

Contoh jika `password_confirmation` isinya beda dengan `password`:
```json
{
    "password": [
        "The password confirmation does not match."
    ]
}
```

**Saran Untuk Frontend:** Tangkap respons error 422 ini menggunakan Blok `try - catch` di Axios, lalu ambil pesannya `error.response.data` lalu tampilkan *Alert* merah ke Karyawan supaya mereka tahu harus memperbaiki ketikan form mereka di bagian mana.

---

## 💻 Contoh Kodingan Axios di React (Buat Contekan FE)

```javascript
import axios from 'axios';

// Fungsi ketika tombol 'Daftar Sekarang' diklik
const handleRegisterSubmit = async (formData) => {
  try {
    const response = await axios.post('http://localhost:8000/api/auth/register', {
      full_name: formData.fullName,
      username: formData.username,
      email: formData.email,
      password: formData.password,
      password_confirmation: formData.confirmPassword,
      division_id: formData.selectedDivisionId // dari Dropdown value
    }, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    console.log("Berhasil mendaftar!", response.data);
    alert(response.data.message); // Menampilkan "Tunggu persetujuan admin..."
    
    // (Arahkan user ke halaman login pakai react-router / useNavigate)

  } catch (error) {
    if (error.response && error.response.status === 422) {
      console.log("Salah ketik form:", error.response.data);
      // Loop Object error.response.data untuk menampilkan pesan merah di UI
    } else {
      console.log("Server error atau koneksi putus", error);
    }
  }
};
```
