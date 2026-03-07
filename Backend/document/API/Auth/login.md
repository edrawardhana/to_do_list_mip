# Login API

- **Endpoint**: `POST /api/auth/login`
- **Auth**: Tidak butuh

Digunakan untuk otentikasi user dan mendapatkan JWT Token.

## Body Request (JSON)
```json
{
    "email": "admin@mcc.com",
    "password": "password123"
}
```

## Headers Wajib
```json
{
    "Accept": "application/json",
    "Content-Type": "application/json"
}
```

## Response Sukses (200 OK)
```json
{
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI... (token sangat panjang)",
    "token_type": "bearer",
    "expires_in": 3600
}
```
*(Catatan untuk FE: Simpan `access_token` ini di LocalStorage/Cookies untuk dipakai pada setiap request lain yang butuh otentikasi).*

## Response Gagal (401 Unauthorized)
```json
{
    "error": "Unauthorized"
}
```

---
**Data Test (Bawaan Seeder)**
- SuperAdmin: `admin@mcc.com` | `password123`
- Intern: `intern@mcc.com` | `password123`
