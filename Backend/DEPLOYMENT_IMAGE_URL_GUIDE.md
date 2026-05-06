# Deployment Guide: Image URL Configuration

**Date**: May 6, 2026  
**Topic**: Image URL handling untuk Development, Staging, dan Production

---

## Overview

Image URL akan otomatis menyesuaikan dengan environment berdasarkan `APP_URL` di `.env` file.

---

## How It Works

### Backend Code
```php
// DailyTaskController.php
$data['evidence_url'] = config('app.url') . Storage::url($storagePath);
```

`config('app.url')` mengambil nilai dari `.env` file:
- Development: `http://localhost:8000`
- Production: `https://api.yourdomain.com`

### Automatic Environment Detection

| Environment | APP_URL | Image URL Result |
|-------------|---------|------------------|
| **Local Dev** | `http://localhost:8000` | `http://localhost:8000/storage/task_evidence/...` |
| **Staging** | `https://staging-api.yourdomain.com` | `https://staging-api.yourdomain.com/storage/...` |
| **Production** | `https://api.yourdomain.com` | `https://api.yourdomain.com/storage/...` |

---

## Configuration per Environment

### 1. Development (Local)

**Backend `.env`**:
```env
APP_URL=http://localhost:8000
```

**Frontend `.env`**:
```env
VITE_API_URL=http://localhost:8000/api
```

**Image URL**:
```
http://localhost:8000/storage/task_evidence/task_123.jpg
```

---

### 2. Staging (Testing Server)

**Backend `.env`**:
```env
APP_URL=https://staging-api.yourdomain.com
APP_ENV=staging
APP_DEBUG=false
```

**Frontend `.env`**:
```env
VITE_API_URL=https://staging-api.yourdomain.com/api
```

**Image URL**:
```
https://staging-api.yourdomain.com/storage/task_evidence/task_123.jpg
```

---

### 3. Production (Live Server)

**Backend `.env`**:
```env
APP_URL=https://api.yourdomain.com
APP_ENV=production
APP_DEBUG=false
```

**Frontend `.env`**:
```env
VITE_API_URL=https://api.yourdomain.com/api
```

**Image URL**:
```
https://api.yourdomain.com/storage/task_evidence/task_123.jpg
```

---

## Deployment Checklist

### Backend Deployment

#### Step 1: Update `.env` File
```bash
# Di server production
cd /path/to/backend
nano .env
```

Update:
```env
APP_URL=https://api.yourdomain.com  # ← Sesuaikan dengan domain
APP_ENV=production
APP_DEBUG=false
```

#### Step 2: Clear Cache
```bash
php artisan config:clear
php artisan cache:clear
php artisan config:cache
```

#### Step 3: Create Symbolic Link
```bash
php artisan storage:link
```

#### Step 4: Set Permissions
```bash
chmod -R 755 storage
chmod -R 755 bootstrap/cache
chown -R www-data:www-data storage
chown -R www-data:www-data bootstrap/cache
```

#### Step 5: Verify
```bash
# Test upload via API
curl -X POST https://api.yourdomain.com/api/daily-tasks/xxx/submit \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "evidence_url=@test.jpg" \
  -F "description=Test"
```

---

### Frontend Deployment

#### Step 1: Update `.env.production`
```env
VITE_API_URL=https://api.yourdomain.com/api
```

#### Step 2: Build
```bash
npm run build
```

#### Step 3: Deploy
Upload `dist/` folder ke hosting (Vercel, Netlify, dll)

---

## Database Migration for Existing Data

Jika sudah ada data dengan URL lama, perlu migration:

### Development → Production Migration

**Scenario**: Data di development punya URL `http://localhost:8000/...`

**Solution**: Run SQL di production database:

```sql
-- Update localhost URLs to production URLs
UPDATE daily_tasks
SET evidence_url = REPLACE(
    evidence_url, 
    'http://localhost:8000', 
    'https://api.yourdomain.com'
)
WHERE evidence_url LIKE 'http://localhost:8000%';
```

### Staging → Production Migration

```sql
-- Update staging URLs to production URLs
UPDATE daily_tasks
SET evidence_url = REPLACE(
    evidence_url, 
    'https://staging-api.yourdomain.com', 
    'https://api.yourdomain.com'
)
WHERE evidence_url LIKE 'https://staging-api.yourdomain.com%';
```

---

## Hosting Platform Examples

### 1. Zeabur (Recommended for Laravel)

**Backend**:
```env
# Zeabur auto-generates APP_URL
APP_URL=${ZEABUR_URL}
```

**Frontend**:
```env
VITE_API_URL=${ZEABUR_BACKEND_URL}/api
```

**Image URL**: `https://your-app.zeabur.app/storage/...`

---

### 2. Railway

**Backend**:
```env
APP_URL=https://${RAILWAY_STATIC_URL}
```

**Frontend**:
```env
VITE_API_URL=https://${RAILWAY_BACKEND_URL}/api
```

---

### 3. Heroku

**Backend**:
```bash
heroku config:set APP_URL=https://your-app.herokuapp.com
```

**Frontend**:
```env
VITE_API_URL=https://your-app.herokuapp.com/api
```

---

### 4. VPS (DigitalOcean, AWS, etc.)

**Backend** (dengan Nginx):
```env
APP_URL=https://api.yourdomain.com
```

**Nginx Config**:
```nginx
server {
    listen 443 ssl;
    server_name api.yourdomain.com;
    
    root /var/www/backend/public;
    
    location /storage {
        alias /var/www/backend/storage/app/public;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
    
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }
}
```

---

## Storage Options

### Option 1: Local Storage (Current)

**Pros**:
- ✅ Simple setup
- ✅ No extra cost
- ✅ Fast access

**Cons**:
- ❌ Files hilang jika server restart (Heroku, Railway)
- ❌ Tidak scalable untuk multiple servers

**Best for**: VPS, Dedicated Server

---

### Option 2: Cloud Storage (Recommended for Production)

#### AWS S3

**Install**:
```bash
composer require league/flysystem-aws-s3-v3 "^3.0"
```

**Config** (`config/filesystems.php`):
```php
's3' => [
    'driver' => 's3',
    'key' => env('AWS_ACCESS_KEY_ID'),
    'secret' => env('AWS_SECRET_ACCESS_KEY'),
    'region' => env('AWS_DEFAULT_REGION'),
    'bucket' => env('AWS_BUCKET'),
    'url' => env('AWS_URL'),
],
```

**`.env`**:
```env
FILESYSTEM_DISK=s3
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_DEFAULT_REGION=ap-southeast-1
AWS_BUCKET=your-bucket
AWS_URL=https://your-bucket.s3.amazonaws.com
```

**Code Change**:
```php
// No change needed! Just update .env
Storage::disk('public')->put($storagePath, $encodedImage);
// Will automatically use S3 if FILESYSTEM_DISK=s3
```

**Image URL**:
```
https://your-bucket.s3.amazonaws.com/task_evidence/task_123.jpg
```

---

#### Supabase Storage

**Install**:
```bash
composer require supabase/storage-php
```

**Config**:
```php
'supabase' => [
    'driver' => 'supabase',
    'key' => env('SUPABASE_KEY'),
    'bucket' => env('SUPABASE_BUCKET'),
    'url' => env('SUPABASE_URL'),
],
```

**`.env`**:
```env
FILESYSTEM_DISK=supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_BUCKET=task-evidence
```

**Image URL**:
```
https://your-project.supabase.co/storage/v1/object/public/task-evidence/task_123.jpg
```

---

## Testing Image URLs

### Test Script

Create `Backend/test_image_url.php`:

```php
<?php
require 'vendor/autoload.php';

// Load environment
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

echo "=== Image URL Configuration Test ===\n\n";

$appUrl = env('APP_URL');
$storagePath = '/storage/task_evidence/test.jpg';
$fullUrl = $appUrl . $storagePath;

echo "APP_URL: {$appUrl}\n";
echo "Storage Path: {$storagePath}\n";
echo "Full URL: {$fullUrl}\n\n";

echo "Environment: " . env('APP_ENV') . "\n";
echo "Debug Mode: " . (env('APP_DEBUG') ? 'ON' : 'OFF') . "\n\n";

// Test URL accessibility
echo "Testing URL accessibility...\n";
$headers = @get_headers($fullUrl);
if ($headers && strpos($headers[0], '200')) {
    echo "✅ URL is accessible\n";
} else {
    echo "❌ URL is not accessible (might be OK if no test file exists)\n";
}
```

Run:
```bash
php test_image_url.php
```

---

## Troubleshooting

### Images Not Loading After Deployment

**Check 1: APP_URL**
```bash
php artisan tinker
>>> config('app.url')
```

Should return production URL, not localhost.

**Fix**:
```bash
php artisan config:clear
php artisan config:cache
```

---

**Check 2: Symbolic Link**
```bash
ls -la public/storage
```

Should point to `../storage/app/public`

**Fix**:
```bash
php artisan storage:link
```

---

**Check 3: Permissions**
```bash
ls -la storage/app/public
```

Should be readable by web server.

**Fix**:
```bash
chmod -R 755 storage
chown -R www-data:www-data storage
```

---

**Check 4: CORS**

If images load but with CORS error, update `config/cors.php`:

```php
'paths' => ['api/*', 'storage/*', 'sanctum/csrf-cookie'],
```

---

## Migration Strategy

### Development → Production

1. **Backup Database**
   ```bash
   pg_dump -h localhost -U postgres -d todolist > backup.sql
   ```

2. **Deploy Backend**
   - Update `.env` with production APP_URL
   - Run migrations
   - Create symbolic link

3. **Migrate Image URLs**
   ```sql
   UPDATE daily_tasks
   SET evidence_url = REPLACE(evidence_url, 'http://localhost:8000', 'https://api.yourdomain.com')
   WHERE evidence_url LIKE 'http://localhost:8000%';
   ```

4. **Copy Image Files**
   ```bash
   # From local to server
   rsync -avz storage/app/public/task_evidence/ \
     user@server:/var/www/backend/storage/app/public/task_evidence/
   ```

5. **Deploy Frontend**
   - Update `.env.production`
   - Build and deploy

6. **Test**
   - Upload new image
   - Verify old images still load
   - Check URLs in database

---

## Best Practices

✅ **DO**:
- Use environment variables for URLs
- Clear config cache after `.env` changes
- Test image upload after deployment
- Use cloud storage for production
- Set proper file permissions
- Enable HTTPS in production

❌ **DON'T**:
- Hardcode URLs in code
- Commit `.env` file to git
- Use localhost URLs in production
- Skip symbolic link creation
- Forget to migrate existing URLs

---

## Summary

| Aspect | Development | Production |
|--------|-------------|------------|
| **APP_URL** | `http://localhost:8000` | `https://api.yourdomain.com` |
| **Storage** | Local disk | Cloud (S3/Supabase) recommended |
| **Image URL** | `http://localhost:8000/storage/...` | `https://api.yourdomain.com/storage/...` |
| **Config** | `.env` | `.env` (different values) |
| **Migration** | Not needed | Run SQL to update URLs |

---

**Key Point**: Cukup update `APP_URL` di `.env` file, image URL akan otomatis menyesuaikan! 🎉
