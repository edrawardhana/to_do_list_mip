# 🚀 Quick Start - Admin Assign Task ke Intern

## ⚡ Setup Cepat (2 Menit)

### 1. Update Database (Supabase)

Jalankan SQL ini di Supabase SQL Editor:

```sql
ALTER TABLE public.daily_tasks 
ADD COLUMN IF NOT EXISTS assign_note text;

ALTER TABLE public.daily_tasks 
ADD COLUMN IF NOT EXISTS assigned_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_daily_tasks_assigned_by ON public.daily_tasks(assigned_by);
```

### 2. Verify

```bash
# Test endpoint
curl -X POST "http://localhost:8000/api/daily-tasks/assign" \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "template_id": "uuid",
    "intern_ids": ["uuid"],
    "task_date": "2026-10-14",
    "assign_note": "Test"
  }'
```

## 📋 Cara Assign Task (Admin)

### cURL
```bash
curl -X POST "http://localhost:8000/api/daily-tasks/assign" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "template_id": "template-uuid",
    "intern_ids": ["intern1-uuid", "intern2-uuid"],
    "task_date": "2026-10-14",
    "assign_note": "Prioritas tinggi - deadline hari ini"
  }'
```

### JavaScript
```javascript
const assignTask = async (templateId, internIds, taskDate, note) => {
  const response = await fetch(`${API_URL}/api/daily-tasks/assign`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      template_id: templateId,
      intern_ids: internIds,
      task_date: taskDate,
      assign_note: note
    })
  });
  return await response.json();
};
```

## 👀 Cara Lihat Task yang Di-assign (Intern)

### 1. Lihat Semua Task
```bash
GET /api/daily-tasks
```

Response includes:
```json
{
  "assigned_by": {
    "id": "uuid",
    "full_name": "Admin Name"
  },
  "assign_note": "Prioritas tinggi - deadline hari ini"
}
```

### 2. Filter by Status
```bash
GET /api/daily-tasks?status=pending
```

## 🎯 Fitur Utama

✅ **Assign ke Multiple Intern** - Bagikan ke beberapa intern sekaligus  
✅ **Custom Instructions** - Tambahkan catatan khusus  
✅ **Division Isolation** - Admin hanya assign dalam divisinya  
✅ **Duplicate Prevention** - Cegah tugas duplikat  
✅ **Audit Trail** - Track siapa assign apa ke siapa  

## 📚 Dokumentasi Lengkap

- [Admin Guide](./document/ADMIN_ASSIGN_TASK_GUIDE.md) - Panduan lengkap
- [API Docs](./document/API/DailyTasks.md) - API documentation
- [Changelog](./CHANGELOG_ASSIGN_TASK_FEATURE.md) - Semua perubahan
- [SQL Script](./document/Database/supabase_add_assign_fields.sql) - Database update

## 🚨 Troubleshooting

### Error: "Hanya Admin yang dapat membagikan tugas"
→ Login sebagai admin/super_admin

### Error: "Tugas sudah ada untuk [nama] pada tanggal ini"
→ Pilih tanggal lain atau template berbeda

### Error: "Anda hanya dapat membagikan tugas dalam divisi Anda"
→ Pilih template dari divisi Anda

## 📞 Need Help?

Baca dokumentasi lengkap di folder `document/` atau hubungi developer team.

---

**Version:** 1.0.0 | **Status:** ✅ Production Ready
