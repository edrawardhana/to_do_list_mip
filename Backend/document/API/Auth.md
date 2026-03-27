# Authentication (JWT Laravel) Endpoint

Sistem autentikasi mandiri berbasis `tymon/jwt-auth`.

### A. Register Akun Baru
`POST /api/auth/register`
- **Body JSON:** 
```json
{
  "full_name": "Rudi", 
  "email": "rudi@mail.com", 
  "password": "password123", 
  "password_confirmation": "password123"
}
```
- Akun default akan otomatis mendapat role `intern` dan `is_verified: false`.

### B. Login
`POST /api/auth/login`
- **Body JSON:** 
```json
{
  "email": "rudi@mail.com", 
  "password": "password123"
}
```
- Mengembalikan `token` JWT (Bearer) jika credentials benar dan akun memiliki `is_verified: true`.

### C. Get Current User (Me)
`GET /api/auth/me`
- **Wajib Header:** `Authorization: Bearer <token>`
- Mengembalikan data profil user yang sedang login beserta relasi `division`-nya.

### D. Logout
`POST /api/auth/logout`
- **Wajib Header:** `Authorization: Bearer <token>`
- Invalidasi session JWT.
