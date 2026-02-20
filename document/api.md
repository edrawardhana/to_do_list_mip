# Cara Menggunakan API

Dokumentasi ini menjelaskan cara menggunakan endpoint API yang tersedia.

---

## Base URL

```
http://localhost:8000/api
```

---

## Autentikasi

API ini menggunakan **JWT (JSON Web Token)**. Setiap request ke endpoint yang dilindungi harus menyertakan token di header:

```
Authorization: Bearer {access_token}
```

---

## Endpoint

### Login

Mendapatkan JWT token dengan email dan password.

```
POST /api/login
```

**Request Body:**

```json
{
    "email": "user@example.com",
    "password": "password123"
}
```

**Response Sukses (200):**

```json
{
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "token_type": "bearer",
    "expires_in": 3600
}
```

**Response Gagal (401):**

```json
{
    "message": "Email atau password salah."
}
```

---

### Me

Mendapatkan data user yang sedang login.

```
GET /api/me
```

**Header:**

```
Authorization: Bearer {access_token}
```

**Response Sukses (200):**

```json
{
    "id": 1,
    "name": "Nama User",
    "email": "user@example.com",
    "created_at": "2026-02-20T00:00:00.000000Z",
    "updated_at": "2026-02-20T00:00:00.000000Z"
}
```

---

### Refresh Token

Mendapatkan token baru sebelum token lama expired.

```
POST /api/refresh
```

**Header:**

```
Authorization: Bearer {access_token}
```

**Response Sukses (200):**

```json
{
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "token_type": "bearer",
    "expires_in": 3600
}
```

---

### Logout

Menginvalidasi token yang sedang aktif.

```
POST /api/logout
```

**Header:**

```
Authorization: Bearer {access_token}
```

**Response Sukses (200):**

```json
{
    "message": "Logout berhasil."
}
```

---

## Ringkasan Endpoint

| Method | Endpoint      | Auth | Keterangan              |
|--------|---------------|------|-------------------------|
| POST   | /api/login    | Tidak | Login dan dapat token  |
| GET    | /api/me       | Ya   | Data user yang login    |
| POST   | /api/refresh  | Ya   | Perbarui token          |
| POST   | /api/logout   | Ya   | Logout dan hapus token  |

---

## Catatan

- Token berlaku selama **1 jam** (3600 detik) setelah dikeluarkan.
- Gunakan endpoint `/api/refresh` sebelum token expired untuk mendapatkan token baru tanpa harus login ulang.
- Token yang sudah di-logout tidak bisa digunakan kembali.
