# Reports API (Analytics Bulanan)

Endpoint ini (Sprint 4) khusus dibuat untuk menghitung agregasi/persentase kehadiran dan penyelesaian tugas bulanan karyawan secara otomatis. Digunakan untuk Dashboard Analytics Frontend.

Wajib Header `Authorization: Bearer <token>`.

### A. Dapatkan Analytics Laporan Bulanan
`GET /api/reports/monthly`

**Query Parameters (Opsional):**
- `month`: Bulan yang ingin di report (Contoh: `10`), *Default: Bulan saat ini*.
- `year`: Tahun yang ingin di report (Contoh: `2026`), *Default: Tahun saat ini*.
- `user_id`: UUID user spesifik jika admin ingin melihat data 1 orang intern.

**Logika Akses (Data Isolation):**
1. Jika Role `intern`: Akan **otomatis** melihat persentase laporannya sendiri (meskipun mencoba mengirim `user_id` teman, akan ditolak/dihiraukan).
2. Jika Role `admin`:
   - Bisa mengirim `user_id` anak divisinya. (Akses ditolak jika mencoba melihat anak divisi lain).
   - Jika **TIDAK** mengirim `user_id`, API akan mengembalikan agregasi rata-rata **seluruh intern dalam divisinya**.
3. Jika Role `super_admin`: 
   - Bebas melihat `user_id` manapun.
   - Jika tidak mengirim `user_id`, akan melihat agregasi global se-perusahaan.

#### Contoh Response Panggilan Individu (`intern` atau `admin` + `user_id`):
```json
{
  "month": 10,
  "year": 2026,
  "user_id": "019cc1...uuid",
  "attendance": {
    "total_scheduled_days": 21,
    "total_absences": 2,
    "percentage": 90.48
  },
  "tasks": {
    "total_tasks": 40,
    "completed_tasks": 35,
    "percentage": 87.5
  }
}
```

#### Contoh Response Panggilan Agregasi Unit/Divisi (`admin` tanpa `user_id`):
```json
{
  "month": 10,
  "year": 2026,
  "scope": "division",
  "average_attendance_percentage": 92.5,
  "average_task_completion_percentage": 88.0,
  "total_interns": 15
}
```
