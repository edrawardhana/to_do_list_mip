# Daftar API

Berikut adalah kumpulan endpoint API yang tersedia untuk dihubungkan ke Frontend.
Setiap fitur telah dipisah halamannya agar lebih mudah dibaca.

---

## 🌍 Base URL

Semua endpoint diakses dengan prefix `/api`.
- **Lokal**: `http://localhost:8000/api`
- **Production (Zeabur)**: `https://todolist-mip.zeabur.app/api`

---

## 🔐 Authentication (Auth & JWT)

Kumpulan API yang mengatur fungsi login, daftar, baca profil, dan logout.

| Fitur | Method | Endpoint | Link Dokumen |
|-------|--------|----------|--------------|
| **Register** | `POST` | `/api/auth/register` | [Baca Dokumen Register](Auth/register.md) |
| **Login** | `POST` | `/api/auth/login` | [Baca Dokumen Login](Auth/login.md) |
| **Get Profil** | `GET` | `/api/auth/me` | [Baca Dokumen Profil User](Auth/me.md) |
| **Logout** | `POST` | `/api/auth/logout` | [Baca Dokumen Logout](Auth/logout.md) |

---

## Format & Headers General

### 1. Request Biasa (Public)
Selalu pastikan axios mengirim header berikut untuk menerima balasan berbentuk JSON:
```json
{
    "Accept": "application/json",
    "Content-Type": "application/json"
}
```

### 2. Request Terlindungi (Private)
Untuk endpoint yang mewajibkan otentikasi (seperti mengambil profil atau halaman dashboard), **Wajib** menambahkan header `Authorization`:
```json
{
    "Accept": "application/json",
    "Authorization": "Bearer <isi_token_jwt_didapat_dari_login>"
}
```
