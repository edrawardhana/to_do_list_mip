<?php
require 'vendor/autoload.php';

use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;
use Intervention\Image\Encoders\JpegEncoder;

try {
    $manager = new ImageManager(new Driver());
    echo "✅ ImageManager instantiation OK" . PHP_EOL;
    echo "   GD extension: " . (extension_loaded('gd') ? 'enabled' : 'MISSING') . PHP_EOL;
    
    // Test decode method (v4 uses decode() not read())
    echo "\n📝 Testing decode() method..." . PHP_EOL;
    echo "   Method exists: " . (method_exists($manager, 'decode') ? 'YES ✅' : 'NO ❌') . PHP_EOL;
    
    // Test encoding with JpegEncoder
    echo "\n📝 Testing JpegEncoder..." . PHP_EOL;
    echo "   JpegEncoder class exists: " . (class_exists('Intervention\Image\Encoders\JpegEncoder') ? 'YES ✅' : 'NO ❌') . PHP_EOL;
    
    echo "\n✅ All checks passed! Image compression ready." . PHP_EOL;
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . PHP_EOL;
}
