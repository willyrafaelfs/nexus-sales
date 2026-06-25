# Gunakan PHP-FPM (bukan CLI/artisan serve) untuk produksi: proses worker tetap
# warm + OPcache cache bytecode → bootstrap jauh lebih cepat & konkuren.
FROM php:8.3-fpm

# Install PostgreSQL (Neon), Redis (queue/cache), dan OPcache (akselerasi bytecode)
RUN apt-get update && apt-get install -y libpq-dev $PHPIZE_DEPS \
    && docker-php-ext-install pdo pdo_pgsql pgsql opcache \
    && pecl install redis \
    && docker-php-ext-enable redis

# Konfigurasi OPcache
COPY docker/opcache.ini /usr/local/etc/php/conf.d/opcache.ini

WORKDIR /app

# Salin semua file Laravel ke dalam kontainer
COPY . .

# Default CMD dari image php:8.3-fpm = "php-fpm" (listen di :9000).
# queue-worker meng-override command-nya sendiri di docker-compose.
