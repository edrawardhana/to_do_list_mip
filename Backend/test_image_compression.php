<?php
/**
 * Script untuk testing kompresi gambar
 * Jalankan: php test_image_compression.php
 * 
 * Note: Script ini memerlukan file gambar test.
 * Jika tidak ada gambar test, akan menampilkan info library saja.
 */

require __DIR__ . '/vendor/autoload.php';

use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;
use Intervention\Image\Encoders\JpegEncoder;

echo "=== Testing Image Compression Library ===\n\n";

try {
    // Create image manager with GD driver
    $manager = new ImageManager(new Driver());
    echo "✅ Intervention Image library loaded successfully!\n";
    echo "   Driver: GD\n\n";
    
    // Check if GD extension is available
    if (extension_loaded('gd')) {
        echo "✅ GD extension is enabled\n";
        $gdInfo = gd_info();
        echo "   GD Version: " . $gdInfo['GD Version'] . "\n";
        echo "   JPEG Support: " . ($gdInfo['JPEG Support'] ? 'Yes' : 'No') . "\n";
        echo "   PNG Support: " . ($gdInfo['PNG Support'] ? 'Yes' : 'No') . "\n";
        echo "   GIF Support: " . ($gdInfo['GIF Read Support'] ? 'Yes' : 'No') . "\n";
        echo "   WebP Support: " . ($gdInfo['WebP Support'] ?? 'No') . "\n\n";
    } else {
        echo "❌ GD extension is NOT enabled\n";
        echo "   Please enable GD extension in php.ini\n\n";
        exit(1);
    }
    
    // Test with actual image compression if test image exists
    $testImagePath = __DIR__ . '/storage/app/public/test_sample.jpg';
    
    if (file_exists($testImagePath)) {
        echo "2. Testing compression with sample image...\n";
        
        $image = $manager->decode($testImagePath);
        $originalSize = filesize($testImagePath);
        
        echo "   Original size: " . number_format($originalSize / 1024, 2) . " KB\n";
        echo "   Original dimensions: " . $image->width() . "x" . $image->height() . "px\n";
        
        // Test resize if needed
        if ($image->width() > 1920) {
            echo "   Resizing to max width 1920px...\n";
            $image->scale(width: 1920);
        }
        
        // Compress
        $compressedPath = __DIR__ . '/storage/app/public/test_compressed.jpg';
        $encodedImage = $image->encode(new JpegEncoder(quality: 80));
        file_put_contents($compressedPath, (string) $encodedImage);
        
        $compressedSize = filesize($compressedPath);
        $compressionRatio = (1 - ($compressedSize / $originalSize)) * 100;
        
        echo "   Compressed size: " . number_format($compressedSize / 1024, 2) . " KB\n";
        echo "   Space saved: " . number_format($compressionRatio, 2) . "%\n";
        echo "   Output: " . $compressedPath . "\n\n";
        
        echo "✅ Compression test completed!\n";
    } else {
        echo "ℹ️  No test image found at: $testImagePath\n";
        echo "   To test compression, place a JPEG image at that location.\n\n";
        echo "✅ Library is ready to use in the application!\n";
    }
    
    echo "\n=== Configuration Summary ===\n";
    echo "Max upload size: 10 MB\n";
    echo "Compression quality: 80%\n";
    echo "Max width: 1920px\n";
    echo "Output format: JPEG\n";
    echo "Supported input formats: JPEG, PNG, GIF, WEBP\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    exit(1);
}
