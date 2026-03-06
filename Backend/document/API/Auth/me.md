# Get Current User Profil (Me)

- **Endpoint**: `GET /api/auth/me`
- **Auth**: **Wajib Header Bearer Token**

Digunakan oleh Frontend untuk mengambil data (profil) user yang sedang login saat ini. Berfungsi juga untuk mengecek apakah token masih valid, serta untuk mendapatkan informasi `role` (apakah dia admin atau intern) agar Frontend bisa mengatur UI menu yang sesuai.

## Headers Wajib
```json
{
    "Accept": "application/json",
    "Authorization": "Bearer <isi_token_panjang_di_sini>"
}
```

## Response Sukses (200 OK)
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
