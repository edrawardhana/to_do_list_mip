# 🚀 Quick Start - Upload Gambar Daily Task

## ⚡ Setup Cepat (5 Menit)

### 1. Install Library
```bash
cd Backend
composer require intervention/image
```

### 2. Setup Storage
```bash
php artisan storage:link
```

### 3. Verify
```bash
php test_image_compression.php
```

Jika muncul ✅, Anda siap!

## 📸 Cara Upload (Intern)

### cURL
```bash
curl -X POST "http://localhost:8000/api/daily-tasks/{id}/submit" \
  -H "Authorization: Bearer {token}" \
  -F "description=Progress selesai 80%" \
  -F "evidence_url=@photo.jpg"
```

### JavaScript
```javascript
const formData = new FormData();
formData.append('description', 'Progress selesai 80%');
formData.append('evidence_url', fileInput.files[0]);

fetch(`${API_URL}/api/daily-tasks/${taskId}/submit`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});
```

## 👀 Cara Review (Admin)

### 1. Lihat Task
```bash
GET /api/daily-tasks?date=2026-10-14
```

### 2. Lihat Gambar
```
http://localhost:8000/storage/task_evidence/task_uuid_timestamp.jpg
```

### 3. Approve
```bash
curl -X PUT "http://localhost:8000/api/daily-tasks/{id}" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"status": "approved"}'
```

## 🎯 Fitur Utama

✅ **Auto Compress** - Gambar otomatis dikompres 60-85%  
✅ **Auto Resize** - Max width 1920px  
✅ **Multi Format** - JPEG, PNG, GIF, WEBP  
✅ **Evidence Lock** - Foto tidak bisa diubah intern  
✅ **Fast Loading** - Admin review lebih cepat  

## 📚 Dokumentasi Lengkap

- [Admin Guide](./document/ADMIN_REVIEW_GUIDE.md) - Panduan lengkap untuk admin
- [Intern Guide](./document/INTERN_UPLOAD_GUIDE.md) - Panduan lengkap untuk intern
- [API Docs](./document/API/DailyTasks.md) - API documentation
- [Feature Docs](./document/IMAGE_COMPRESSION_FEATURE.md) - Technical details
- [Changelog](./CHANGELOG_IMAGE_COMPRESSION.md) - Semua perubahan

## 🚨 Troubleshooting

### Gambar tidak muncul?
```bash
php artisan storage:link
```

### GD extension error?
Edit `php.ini`, uncomment:
```ini
extension=gd
```

### PostgreSQL error?
Edit `php.ini`, uncomment:
```ini
extension=pdo_pgsql
extension=pgsql
```

Restart server setelah edit php.ini!

## 📞 Need Help?

Baca dokumentasi lengkap di folder `document/` atau hubungi developer team.

---

**Version:** 1.0.0 | **Status:** ✅ Production Ready
