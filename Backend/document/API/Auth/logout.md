# Logout

- **Endpoint**: `POST /api/auth/logout`
- **Auth**: **Wajib Header Bearer Token**

Digunakan agar backend mencatat bahwa token tersebut sudah hangus (revoked) dan tidak bisa dipakai lagi (Log out server-side). 
Di sisi Frontend, jangan lupa juga untuk menghapus token dari `LocalStorage` atau `Cookies` secara mandiri.

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
    "message": "Successfully logged out"
}
```
