# API Endpoints (Auth & JWT)

Dokumentasi endpoint API utama yang saat ini berjalan, khususnya untuk autentikasi Frontend ke Backend.

---

## Base URL

Semua endpoint diakses dengan prefix `/api`.
- **Lokal**: `http://localhost:8000/api`
- **Production (Zeabur)**: `https://todolist-mip.zeabur.app/api`

---

## Format & Headers Wajib

Untuk login/register cukup Header JSON biasa:
```json
{
    "Accept": "application/json",
    "Content-Type": "application/json"
}
```

**Penting:** Untuk endpoint yang dilindungi Auth (seperti `me` dan `logout`), **WAJIB** mengirimkan header Authorization berisi token JWT yang didapat saat login:
```json
{
    "Accept": "application/json",
    "Authorization": "Bearer <isi_token_panjang_di_sini>"
}
```

---

## Daftar Endpoint Authentication (JWT)

Semua routing auth dibungkus di dalam prefix `auth/`.

### 1. Register User Baru
- **Endpoint**: `POST /api/auth/register`
- **Auth**: Tidak butuh (Bebas akses)
- **Fungsi**: Mendaftarkan karyawan baru. Wajib memilih divisi. Akun akan berstatus `is_locked: true` dan harus menunggu Admin untuk meng-ACC.
- **Body Request (JSON):**
  ```json
  {
      "full_name": "Nama Karyawan",
      "email": "karyawan@mcc.com",
      "password": "password123",
      "division_id": "019cc113-... (UUID dari tabel divisions)"
  }
  ```
- **Response Sukses (201 Created):**
  ```json
  {
      "message": "User successfully registered. Please wait for admin approval.",
      "user": {
          "id": "uuid-otomatis",
          "full_name": "Nama Karyawan",
          "email": "karyawan@mcc.com",
          "role": "user",
          "is_locked": true,
          "division_id": "019cc113-..."
      }
  }
  ```

### 2. Login
- **Endpoint**: `POST /api/auth/login`
- **Auth**: Tidak butuh
- **Body Request (JSON):**
  ```json
  {
      "email": "admin@mcc.com",
      "password": "password123"
  }
  ```
- **Response Sukses (200 OK):**
  ```json
  {
      "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI... (token sangat panjang)",
      "token_type": "bearer",
      "expires_in": 3600
  }
  ```
  *(Catatan untuk FE: Simpan `access_token` ini di LocalStorage/Cookies untuk dipakai request lain).*

- **Response Gagal (401 Unauthorized):**
  ```json
  {
      "error": "Unauthorized"
  }
  ```

### 3. Get Current User Profil (`me`)
- **Endpoint**: `GET /api/auth/me`
- **Auth**: **Wajib Header Bearer Token**
- **Fungsi**: Untuk FE mengambil data user yang sedang login saat ini (misal untuk mengecek nama dan role admin/intern).
- **Response Sukses (200 OK):**
  ```json
  {
      "id": "019cc1...",
      "division_id": "019cc1...",
      "full_name": "Admin MCC",
      "email": "admin@mcc.com",
      "role": "super_admin",
      "shift": "pagi",
      "is_locked": false
  }
  ```

### 4. Logout
- **Endpoint**: `POST /api/auth/logout`
- **Auth**: **Wajib Header Bearer Token**
- **Fungsi**: Supaya backend mencatat bahwa token tersebut sudah hangus/tidak bisa dipakai lagi. (Di sisi FE jg wajib hapus LocalStorage).
- **Response Sukses (200 OK):**
  ```json
  {
      "message": "Successfully logged out"
  }
  ```

---

## Data Test (Akun Bawaan Seeder)

Ada 2 akun yang sudah langsung tertanam berkat `DatabaseSeeder`, bisa dipakai frontend buat test login:

**Akun SuperAdmin:**
- Email: `admin@mcc.com`
- Password: `password123`
- Role: `super_admin`

**Akun Karyawan Biasa:**
- Email: `intern@mcc.com`
- Password: `password123`
- Role: `user`
