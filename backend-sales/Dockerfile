# Gunakan mesin PHP 8.3
FROM php:8.3-cli

# Install alat dasar dan "bahasa" PostgreSQL agar bisa terhubung ke Neon,
# plus ekstensi Redis (phpredis) untuk koneksi queue ke Redis
RUN apt-get update && apt-get install -y libpq-dev $PHPIZE_DEPS \
    && docker-php-ext-install pdo pdo_pgsql pgsql \
    && pecl install redis \
    && docker-php-ext-enable redis

# Atur ruang kerja di dalam kontainer
WORKDIR /app

# Salin semua file Laravel kamu ke dalam kontainer
COPY . .

# Jalankan server Laravel
CMD php artisan serve --host=0.0.0.0 --port=8000