# 📋 Panduan Admin: Membagikan Tugas ke Intern

## 🎯 Overview

Sebagai Admin Divisi, Anda dapat membagikan tugas ke intern tertentu dengan instruksi khusus. Fitur ini berguna untuk:
- Membagikan tugas urgent ke intern tertentu
- Membagikan tugas dengan deadline spesifik
- Membagikan tugas dengan instruksi khusus
- Membagikan tugas ke beberapa intern sekaligus

## 📝 Cara Membagikan Tugas

### 1. Endpoint

**URL:** `POST /api/daily-tasks/assign`

**Headers:**
```
Authorization: Bearer {your_admin_token}
Content-Type: application/json
```

### 2. Request Body

```json
{
  "template_id": "uuid-template",
  "intern_ids": ["uuid-intern1", "uuid-intern2"],
  "task_date": "2026-10-14",
  "assign_note": "Prioritas tinggi - deadline hari ini jam 5 sore"
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `template_id` | UUID | ✅ Yes | ID template tugas yang akan dibagikan |
| `intern_ids` | Array | ✅ Yes | Array UUID intern yang akan menerima tugas |
| `task_date` | Date | ✅ Yes | Tanggal tugas (format: YYYY-MM-DD) |
| `assign_note` | String | ❌ No | Catatan/instruksi khusus untuk tugas ini (max 500 karakter) |

### 3. Contoh Request

#### a. Membagikan ke 1 Intern

```bash
curl -X POST "http://localhost:8000/api/daily-tasks/assign" \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "template_id": "550e8400-e29b-41d4-a716-446655440001",
    "intern_ids": ["660e8400-e29b-41d4-a716-446655440002"],
    "task_date": "2026-10-14",
    "assign_note": "Selesaikan modul login sebelum jam 5 sore"
  }'
```

#### b. Membagikan ke Beberapa Intern Sekaligus

```bash
curl -X POST "http://localhost:8000/api/daily-tasks/assign" \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "template_id": "550e8400-e29b-41d4-a716-446655440001",
    "intern_ids": [
      "660e8400-e29b-41d4-a716-446655440002",
      "770e8400-e29b-41d4-a716-446655440003",
      "880e8400-e29b-41d4-a716-446655440004"
    ],
    "task_date": "2026-10-14",
    "assign_note": "Tugas urgent - prioritas tinggi"
  }'
```

#### c. Membagikan Tanpa Catatan Khusus

```bash
curl -X POST "http://localhost:8000/api/daily-tasks/assign" \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "template_id": "550e8400-e29b-41d4-a716-446655440001",
    "intern_ids": ["660e8400-e29b-41d4-a716-446655440002"],
    "task_date": "2026-10-14"
  }'
```

### 4. Response

#### Success Response

```json
{
  "status": "success",
  "message": "3 tugas berhasil dibagikan.",
  "data": {
    "created_tasks": [
      {
        "id": "990e8400-e29b-41d4-a716-446655440005",
        "uploader_id": "660e8400-e29b-41d4-a716-446655440002",
        "division_id": "880e8400-e29b-41d4-a716-446655440003",
        "template_id": "550e8400-e29b-41d4-a716-446655440001",
        "task_date": "2026-10-14",
        "status": "pending",
        "assign_note": "Prioritas tinggi - deadline hari ini",
        "assigned_by": "admin-uuid",
        "created_at": "2026-10-14T08:00:00Z"
      },
      {
        "id": "aa0e8400-e29b-41d4-a716-446655440006",
        "uploader_id": "770e8400-e29b-41d4-a716-446655440003",
        "division_id": "880e8400-e29b-41d4-a716-446655440003",
        "template_id": "550e8400-e29b-41d4-a716-446655440001",
        "task_date": "2026-10-14",
        "status": "pending",
        "assign_note": "Prioritas tinggi - deadline hari ini",
        "assigned_by": "admin-uuid",
        "created_at": "2026-10-14T08:00:00Z"
      }
    ],
    "errors": [
      "Tugas sudah ada untuk Jane Doe pada tanggal ini."
    ]
  }
}
```

**Penjelasan Response:**
- `created_tasks`: Array tugas yang berhasil dibuat
- `errors`: Array pesan error untuk intern yang gagal (misalnya tugas sudah ada)

#### Error Responses

**1. Bukan Admin**
```json
{
  "status": "error",
  "message": "Hanya Admin yang dapat membagikan tugas."
}
```
HTTP Status: `403 Forbidden`

**2. Template Tidak Ditemukan**
```json
{
  "message": "The selected template id is invalid.",
  "errors": {
    "template_id": ["The selected template id is invalid."]
  }
}
```
HTTP Status: `422 Unprocessable Entity`

**3. Intern Tidak Ditemukan**
```json
{
  "message": "The selected intern_ids.0 is invalid.",
  "errors": {
    "intern_ids.0": ["The selected intern_ids.0 is invalid."]
  }
}
```
HTTP Status: `422 Unprocessable Entity`

**4. Template Bukan dari Divisi Admin**
```json
{
  "status": "error",
  "message": "Anda hanya dapat membagikan tugas dalam divisi Anda."
}
```
HTTP Status: `403 Forbidden`

## 🔍 Workflow Lengkap

### Step 1: Dapatkan Daftar Template Tugas

```bash
GET /api/task-templates
```

Response:
```json
{
  "status": "success",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "title": "Development Task",
      "description": "Daily development progress",
      "division_id": "880e8400-e29b-41d4-a716-446655440003",
      "is_active": true
    }
  ]
}
```

### Step 2: Dapatkan Daftar Intern di Divisi Anda

```bash
GET /api/profiles?role=intern&division_id={your_division_id}
```

Response:
```json
{
  "status": "success",
  "data": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440002",
      "full_name": "John Doe",
      "email": "john@example.com",
      "role": "intern",
      "division_id": "880e8400-e29b-41d4-a716-446655440003"
    },
    {
      "id": "770e8400-e29b-41d4-a716-446655440003",
      "full_name": "Jane Smith",
      "email": "jane@example.com",
      "role": "intern",
      "division_id": "880e8400-e29b-41d4-a716-446655440003"
    }
  ]
}
```

### Step 3: Bagikan Tugas

```bash
POST /api/daily-tasks/assign
```

Body:
```json
{
  "template_id": "550e8400-e29b-41d4-a716-446655440001",
  "intern_ids": [
    "660e8400-e29b-41d4-a716-446655440002",
    "770e8400-e29b-41d4-a716-446655440003"
  ],
  "task_date": "2026-10-14",
  "assign_note": "Prioritas tinggi"
}
```

### Step 4: Verifikasi Tugas Sudah Dibagikan

```bash
GET /api/daily-tasks?date=2026-10-14
```

Response akan menampilkan tugas yang baru dibagikan dengan field `assigned_by` berisi ID admin.

## 📊 Use Cases

### 1. Tugas Urgent

**Scenario:** Ada bug critical yang harus diperbaiki hari ini.

```json
{
  "template_id": "bug-fix-template-uuid",
  "intern_ids": ["senior-intern-uuid"],
  "task_date": "2026-10-14",
  "assign_note": "URGENT: Bug critical di production - prioritas tertinggi!"
}
```

### 2. Tugas Tim

**Scenario:** Proyek besar yang membutuhkan kolaborasi beberapa intern.

```json
{
  "template_id": "project-template-uuid",
  "intern_ids": [
    "intern1-uuid",
    "intern2-uuid",
    "intern3-uuid"
  ],
  "task_date": "2026-10-14",
  "assign_note": "Proyek website company profile - koordinasi dengan tim"
}
```

### 3. Tugas dengan Deadline Spesifik

**Scenario:** Tugas harus selesai sebelum meeting dengan client.

```json
{
  "template_id": "presentation-template-uuid",
  "intern_ids": ["intern-uuid"],
  "task_date": "2026-10-14",
  "assign_note": "Selesaikan sebelum meeting jam 2 siang dengan client"
}
```

### 4. Tugas Pembelajaran

**Scenario:** Memberikan tugas khusus untuk pembelajaran intern baru.

```json
{
  "template_id": "learning-template-uuid",
  "intern_ids": ["new-intern-uuid"],
  "task_date": "2026-10-14",
  "assign_note": "Tutorial: Pelajari Laravel basics - lihat dokumentasi di whiteboard"
}
```

## 🔒 Aturan & Validasi

### 1. Hak Akses
- ✅ **Admin**: Hanya bisa assign task dalam divisinya sendiri
- ✅ **Super Admin**: Bisa assign task ke divisi manapun
- ❌ **Intern**: Tidak bisa assign task

### 2. Validasi Tugas
- ✅ Template harus ada dan aktif
- ✅ Intern harus ada di database
- ✅ Tidak bisa assign tugas yang sudah ada untuk intern pada tanggal yang sama
- ✅ Admin hanya bisa assign ke intern dalam divisinya (untuk role admin)

### 3. Audit Log
Setiap assign task akan tercatat di audit log dengan informasi:
- Admin yang assign
- Intern yang menerima
- Template tugas
- Tanggal tugas
- Catatan assign

## 💡 Tips & Best Practices

### 1. Gunakan Assign Note yang Jelas
❌ **Bad:**
```json
{
  "assign_note": "Kerjakan"
}
```

✅ **Good:**
```json
{
  "assign_note": "Selesaikan modul authentication dengan fitur: login, register, forgot password. Deadline: hari ini jam 5 sore. Referensi: lihat dokumentasi di whiteboard."
}
```

### 2. Assign ke Intern yang Tepat
- Pertimbangkan skill level intern
- Pertimbangkan workload intern saat ini
- Pertimbangkan deadline tugas

### 3. Gunakan Batch Assign untuk Tugas Tim
Jika tugas membutuhkan kolaborasi, assign ke semua anggota tim sekaligus:

```json
{
  "intern_ids": ["intern1", "intern2", "intern3"],
  "assign_note": "Tugas tim - koordinasi dengan anggota lain"
}
```

### 4. Cek Tugas yang Sudah Ada
Sebelum assign, cek apakah intern sudah punya tugas pada tanggal tersebut:

```bash
GET /api/daily-tasks?date=2026-10-14&uploader_id={intern_id}
```

## 📱 Integrasi Frontend

### React Example

```javascript
const assignTask = async (templateId, internIds, taskDate, assignNote) => {
  try {
    const response = await fetch(
      `${API_URL}/api/daily-tasks/assign`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          template_id: templateId,
          intern_ids: internIds,
          task_date: taskDate,
          assign_note: assignNote
        })
      }
    );

    const result = await response.json();

    if (result.status === 'success') {
      alert(`${result.message}`);
      console.log('Created tasks:', result.data.created_tasks);
      
      if (result.data.errors.length > 0) {
        console.warn('Errors:', result.data.errors);
      }
    } else {
      alert('Error: ' + result.message);
    }

    return result;
  } catch (error) {
    console.error('Error assigning task:', error);
    throw error;
  }
};

// Usage
assignTask(
  'template-uuid',
  ['intern1-uuid', 'intern2-uuid'],
  '2026-10-14',
  'Prioritas tinggi - deadline hari ini'
);
```

### Vue Example

```vue
<template>
  <div>
    <h2>Bagikan Tugas ke Intern</h2>
    
    <form @submit.prevent="assignTask">
      <div>
        <label>Template Tugas:</label>
        <select v-model="form.template_id" required>
          <option v-for="template in templates" :key="template.id" :value="template.id">
            {{ template.title }}
          </option>
        </select>
      </div>

      <div>
        <label>Pilih Intern:</label>
        <div v-for="intern in interns" :key="intern.id">
          <input 
            type="checkbox" 
            :value="intern.id" 
            v-model="form.intern_ids"
          />
          {{ intern.full_name }}
        </div>
      </div>

      <div>
        <label>Tanggal Tugas:</label>
        <input type="date" v-model="form.task_date" required />
      </div>

      <div>
        <label>Catatan (opsional):</label>
        <textarea v-model="form.assign_note" maxlength="500"></textarea>
      </div>

      <button type="submit" :disabled="loading">
        {{ loading ? 'Membagikan...' : 'Bagikan Tugas' }}
      </button>
    </form>
  </div>
</template>

<script>
export default {
  data() {
    return {
      form: {
        template_id: '',
        intern_ids: [],
        task_date: '',
        assign_note: ''
      },
      templates: [],
      interns: [],
      loading: false
    };
  },
  methods: {
    async assignTask() {
      this.loading = true;

      try {
        const response = await fetch(
          `${process.env.VUE_APP_API_URL}/api/daily-tasks/assign`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.$store.state.token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(this.form)
          }
        );

        const result = await response.json();

        if (result.status === 'success') {
          alert(result.message);
          this.resetForm();
        } else {
          alert('Error: ' + result.message);
        }
      } catch (error) {
        console.error('Error:', error);
        alert('Terjadi kesalahan saat membagikan tugas');
      } finally {
        this.loading = false;
      }
    },
    resetForm() {
      this.form = {
        template_id: '',
        intern_ids: [],
        task_date: '',
        assign_note: ''
      };
    }
  }
};
</script>
```

## 🚨 Troubleshooting

### Problem: "Hanya Admin yang dapat membagikan tugas"

**Cause:** User yang login bukan admin atau super_admin

**Solution:** Pastikan login sebagai admin atau super_admin

### Problem: "Anda hanya dapat membagikan tugas dalam divisi Anda"

**Cause:** Template tugas bukan dari divisi admin

**Solution:** Pilih template tugas yang sesuai dengan divisi Anda

### Problem: "Tugas sudah ada untuk [nama intern] pada tanggal ini"

**Cause:** Intern sudah memiliki tugas dengan template yang sama pada tanggal tersebut

**Solution:** 
- Pilih tanggal lain
- Atau pilih template tugas yang berbeda
- Atau skip intern tersebut

### Problem: "The selected intern_ids.X is invalid"

**Cause:** UUID intern tidak valid atau tidak ada di database

**Solution:** Pastikan UUID intern benar dan intern ada di database

## 📞 Support

Jika ada pertanyaan atau masalah:
- Baca dokumentasi lengkap di folder `document/`
- Hubungi developer team
- Email: developer@mip.co.id

## 📚 Referensi

- [API Documentation - Daily Tasks](./API/DailyTasks.md)
- [Admin Review Guide](./ADMIN_REVIEW_GUIDE.md)
- [Intern Upload Guide](./INTERN_UPLOAD_GUIDE.md)

---

**Last Updated:** 2026-05-03  
**Version:** 1.0.0
