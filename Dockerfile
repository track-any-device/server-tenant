FROM php:8.5-fpm-alpine AS builder

# Build tools + system dependencies
RUN apk add --no-cache \
    autoconf gcc g++ make \
    git curl \
    libzip-dev oniguruma-dev \
    zip unzip \
    nodejs npm \
    && npm install -g pnpm

# PHP extensions needed for the portal (no gd — no image processing on server)
RUN docker-php-ext-install pdo pdo_mysql zip mbstring opcache
RUN pecl install redis && docker-php-ext-enable redis

WORKDIR /app

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# PHP dependencies
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-interaction --prefer-dist

# JS dependencies + build
COPY package.json pnpm-lock.yaml* .npmrc* ./
RUN pnpm install --frozen-lockfile --ignore-scripts

COPY . .
RUN pnpm run build

# Remove dev JS artifacts — only the built assets matter at runtime
RUN rm -rf node_modules resources/js

# ── Runtime stage ──────────────────────────────────────────────────────────────
FROM php:8.5-fpm-alpine AS runtime

RUN apk add --no-cache libzip oniguruma nginx supervisor

# Copy compiled PHP extensions from builder (no build tools needed at runtime)
COPY --from=builder /usr/local/lib/php/extensions/ /usr/local/lib/php/extensions/
COPY --from=builder /usr/local/etc/php/conf.d/     /usr/local/etc/php/conf.d/

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
