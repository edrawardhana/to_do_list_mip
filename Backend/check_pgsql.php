<?php
// Script untuk memeriksa ekstensi PostgreSQL
echo "Checking PostgreSQL extensions...\n\n";

if (extension_loaded('pdo_pgsql')) {
    echo "✓ pdo_pgsql is ENABLED\n";
} else {
    echo "✗ pdo_pgsql is NOT enabled\n";
}

if (extension_loaded('pgsql')) {
    echo "✓ pgsql is ENABLED\n";
} else {
    echo "✗ pgsql is NOT enabled\n";
}

echo "\nAll loaded PDO drivers:\n";
print_r(PDO::getAvailableDrivers());
