# Register User Baru

- **Endpoint**: `POST /api/auth/register`
- **Auth**: Tidak butuh (Bebas akses)

Berfungsi untuk mendaftarkan karyawan baru. User **wajib** memilih divisi. 
Akun yang berhasil didaftarkan akan berstatus `is_locked: true` dan harus menunggu persetujuan (ACC) dari Admin terkait sebelum bisa login.

## Body Request (JSON)
```json
{
    "full_name": "Nama Karyawan",
    "email": "karyawan@mcc.com",
    "password": "password123",
    "division_id": "019cc113-... (UUID dari tabel divisions)"
}
```

## Headers Wajib
```json
{
    "Accept": "application/json",
    "Content-Type": "application/json"
}
```

## Response Sukses (201 Created)
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
