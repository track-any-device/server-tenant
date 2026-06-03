FROM php:8.3-fpm-alpine AS builder

# System dependencies
RUN apk add --no-cache \
    git \
    curl \
    libpng-dev \
    libzip-dev \
    zip \
    unzip \
    nodejs \
    npm \
    && npm install -g pnpm

# PHP extensions
RUN docker-php-ext-install pdo pdo_mysql zip gd opcache

# Install redis extension from PECL
RUN pecl install redis && docker-php-ext-enable redis

WORKDIR /app

# Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# PHP dependencies
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-interaction --prefer-dist

# JS dependencies + build
COPY package.json pnpm-lock.yaml* .npmrc* ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

# Remove dev JS artifacts — only the built assets matter at runtime
RUN rm -rf node_modules resources/js

# ── Runtime stage ─────────────────────────────────────────────────────────────
FROM php:8.3-fpm-alpine AS runtime

RUN apk add --no-cache libpng libzip nginx supervisor

# PHP extensions
RUN docker-php-ext-install pdo pdo_mysql opcache
RUN pecl install redis && docker-php-ext-enable redis

WORKDIR /var/www/html

COPY --from=builder /app .
COPY --from=builder /app/vendor ./vendor

# Nginx config
COPY docker/nginx.conf /etc/nginx/http.d/default.conf

# Supervisor config
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# OPcache settings for production
COPY docker/opcache.ini /usr/local/etc/php/conf.d/opcache.ini

RUN chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

EXPOSE 80

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
