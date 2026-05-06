# Hotfix - Intervention Image Facade Error

## 📅 Tanggal: 2026-05-06

## 🐛 Masalah

**Error:** `Class "Intervention\Image\Laravel\Facades\Image" not found`

**Penyebab:** Laravel 12 tidak support Facade untuk Intervention Image v4. Harus menggunakan `ImageManager` langsung.

## ✅ Solusi

### File: `Backend/app/Http/Controllers/DailyTaskController.php`

**BEFORE (salah):**
```php
use Intervention\Image\Laravel\Facades\Image;

// Di method submit() dan update()
$image = Image::read($file);
```

**AFTER (benar):**
```php
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;

// Di method submit() dan update()
$manager = new ImageManager(new Driver());
$image = $manager->read($file);
```

### Perubahan Detail

**1. Import statements:**
```php
// Hapus
use Intervention\Image\Laravel\Facades\Image;

// Tambah
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;
```

**2. Method `submit()` — line ~270:**
```php
// Compress and save image using ImageManager
$manager = new ImageManager(new Driver());
$image = $manager->read($file);

// Resize if image is too large (max width 1920px, maintain aspect ratio)
if ($image->width() > 1920) {
    $image->scale(width: 1920);
}

// Encode to JPEG with 80% quality for compression
$encodedImage = $image->toJpeg(quality: 80);

// Save to storage
Storage::disk('public')->put($storagePath, $encodedImage);
```

**3. Method `update()` — line ~354:**
```php
// Compress and save image using ImageManager
$manager = new ImageManager(new Driver());
$image = $manager->read($file);

// Resize if image is too large (max width 1920px, maintain aspect ratio)
if ($image->width() > 1920) {
    $image->scale(width: 1920);
}

// Encode to JPEG with 80% quality for compression
$encodedImage = $image->toJpeg(quality: 80);

// Save to storage
Storage::disk('public')->put($storagePath, $encodedImage);
```

## 🧪 Testing

```bash
# Test ImageManager
php test_image_manager.php

# Expected output:
# ✅ ImageManager OK
#    GD extension: enabled
```

## 📚 Referensi

- [Intervention Image v4 Documentation](https://image.intervention.io/v4)
- Laravel 12 tidak support Facade untuk library third-party secara default

---

**Status:** ✅ FIXED
