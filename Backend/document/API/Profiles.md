# Profiles (Manajemen Karyawan / Rekan Kerja)

Akses ke tabel `profiles` (Karyawan/User) lintas autentikasi. Sangat penting bagi fitur tagging `confirmed_participants`.
Semua aksi Wajib Header `Authorization: Bearer <token>`.

### A. Lihat Teman Se-Divisi (Semua Role)
`GET /api/profiles`
- Responnya berisi *List UUID*, Namalengkap, Nickname, & Shift dari intern dalam 1 divisi. 
- (Biasa digunakan FRONTEND untuk mengisi Dropdown menu Participant Tagging).

### B. Lihat Profil Spesifik
`GET /api/profiles/{id}`

### C. Kelola Data Profile 

**Tipe 1: Oleh Super Admin / HRD (Admin)**
Bisa digunakan memanipulasi *Approval* keanggotaan karyawan baru, role promotion, dan blocking.
`PUT /api/profiles/{id}`
**Body JSON:**
```json
{
  "role": "admin",
  "is_verified": true,
  "is_locked": false, 
  "division_id": "uuid-it-dept"
}
```

**Tipe 2: Oleh Diri Sendiri (Intern Biasa)**
Intern hanya diperbolehkan mengupdate profilnya di field tertentu.
`PUT /api/profiles/{id}` (Wajib Profile ID miliknya sendiri)
**Body JSON:**
```json
{
  "avatar_url": "https://...",
  "phone_number": "08123456789",
  "nickname": "Dodo"
}
```
Pencegahan keamanan via Model Controller Laravel memblokir user jika mencoba manipulasi `role` miliknya sendiri.
