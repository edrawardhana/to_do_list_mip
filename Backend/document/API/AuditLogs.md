# Ghost Audit Log (Jejak Aktivitas Sistem)

Log aktivitas Admin/Super Admin yang **bersifat MUTLAK PERMANEN** (Tidak bisa dihapus/diubah oleh siapapun), berkat perlindungan 3 lapis: *Database Trigger*, *RLS Policy*, dan penguncian instance *Laravel Model Guard*.
Sangat berisiko untuk mencoba menjebol log ini, karena SQL Exception akan dilempar secara beruntun.

Wajib Header `Authorization: Bearer <token>`.

### A. Lihat Rekaman Log (Khusus Admin/Super Admin)
`GET /api/audit-logs`
- Respons akan menyertakan data pelaku (Admin yang *Approve/Reject* Logbook, dsb), Objek targetnya, beserta payload kolom JSON `old_values` & `new_values`.
- `super_admin` melihat log seluruh negara/divisi.
- `admin` biasa hanya diperlihatkan *log* karyawan dari devisinya sendiri-sendiri, dibatasi Controller.
- Filter opsional: `?action=Approve Logbook`

### B. Endpoint Modifikasi (Dilarang)
- `POST`, `PUT`, `DELETE` secara definitif *hard-blocked* pada level router dan ORM. Aplikasi frontend tidak perlu peduli dengan metode-metode ini, karena insertion hanya dieksekusi diam-diam di sisi backend setiap kali Controller melakukan pembaruan vital.
