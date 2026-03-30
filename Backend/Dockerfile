# Gunakan Official PHP Apache Image yang lebih stabil untuk Production
FROM php:8.2-apache

# Install OS dependencies & ekstensi PHP yang dibutuhkan Laravel + PostgreSQL (Supabase)
RUN apt-get update && apt-get install -y \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    libpq-dev \
    zip \
    unzip \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install ekstensi PHP
RUN docker-php-ext-install pdo_pgsql mbstring exif pcntl bcmath gd

# Aktifkan mod_rewrite Apache (Wajib untuk routing Laravel)
RUN a2enmod rewrite

# Konfigurasi Apache DocumentRoot agar langsung menunjuk ke folder public Laravel
ENV APACHE_DOCUMENT_ROOT /var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

# Ubah Port default Apache dari 80 menjadi 8000 (menyesuaikan default port Koyeb)
RUN sed -i 's/80/8000/g' /etc/apache2/sites-available/000-default.conf /etc/apache2/ports.conf

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory & Copy semua kode Backend
WORKDIR /var/www/html
COPY . .

# Install dependencies Laravel produksi (tanpa dev/tinker)
RUN composer install --no-dev --optimize-autoloader

# Atur Izin Folder (Permission) agar Laravel bisa menulis cache & logs
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

# Ekspos Port 8000 yang sesuai dengan default Koyeb Health Check
EXPOSE 8000

# Saat Container jalan: Clear & Cache Config untuk Production, Migrasi DB, lalu Start Server
CMD php artisan config:clear && \
    php artisan config:cache && \
    php artisan route:cache && \
    php artisan view:cache && \
    php artisan migrate --force && \
    apache2-foreground
