# ✅ QUICK FIX: ImageManager v4 API Update

## Problems
```
1. Call to undefined method Intervention\Image\ImageManager::read()
2. Call to undefined method Intervention\Image\Image::toJpeg()
```

## Solution
Updated to Intervention Image v4 API.

## What Changed
✅ **DailyTaskController.php**:
- Added import: `use Intervention\Image\Encoders\JpegEncoder;`
- Line 271 & 355: `read()` → `decode()`
- Line 279 & 363: `toJpeg()` → `encode(new JpegEncoder(quality: 80))`
- Line 282 & 366: Added `(string)` cast

## Test
```bash
cd Backend
php test_image_manager.php
```

Expected: ✅ All checks passed!

## Try It
1. Login sebagai intern
2. Upload foto di task
3. ✅ Berhasil dikompresi dan disimpan!

---

## Intervention Image v4 API

**Reading Images:**
- ❌ `$manager->read($file)` (v3)
- ✅ `$manager->decode($file)` (v4)

**Encoding Images:**
- ❌ `$image->toJpeg(80)` (v3)
- ✅ `$image->encode(new JpegEncoder(quality: 80))` (v4)

**Saving:**
- ❌ `Storage::put($path, $encoded)` (v3)
- ✅ `Storage::put($path, (string) $encoded)` (v4)

---

See `HOTFIX_IMAGEMANAGER_DECODE.md` for complete details.
