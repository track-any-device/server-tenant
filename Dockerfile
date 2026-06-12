FROM php:8.5-fpm-alpine AS builder

# Build tools + system dependencies
RUN apk add --no-cache \
    autoconf gcc g++ make \
    git curl \
    zip unzip \
    nodejs npm \
    && npm install -g pnpm

# PHP extensions for the portal.
# pdo, pdo_sqlite, mbstring, and opcache are already built into
# php:8.5-fpm-alpine (pdo is always static in 8.5 — attempting to build it
# shared fails). Only pdo_mysql is added, for optional on-premise MySQL.
RUN docker-php-ext-install pdo_mysql
RUN pecl install redis && docker-php-ext-enable redis

WORKDIR /app

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# PHP dependencies
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-interaction --prefer-dist

# JS dependencies + build. pnpm-workspace.yaml must be in this layer —
# without it pnpm installs in non-workspace mode, then the deps check at
# `pnpm run build` sees node_modules as out of sync and aborts (no TTY).
ENV CI=true
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* .npmrc* ./
RUN pnpm install --frozen-lockfile --ignore-scripts

COPY . .
RUN pnpm run build

# Remove dev JS artifacts — only the built assets matter at runtime
RUN rm -rf node_modules resources/js

# ── Runtime stage ──────────────────────────────────────────────────────────────
FROM php:8.5-fpm-alpine AS runtime

RUN apk add --no-cache nginx supervisor

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
