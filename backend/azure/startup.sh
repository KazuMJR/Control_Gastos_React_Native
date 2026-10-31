#!/usr/bin/env bash
set -euo pipefail

APP_ROOT="/home/site/wwwroot"
PASSPORT_KEYS_DIR="/home/passport-keys"
PERSISTENT_DATA_DIR="/home/data"

cd "$APP_ROOT"

mkdir -p \
    resources/views \
    storage/framework/cache \
    storage/framework/sessions \
    storage/framework/views \
    bootstrap/cache
chmod -R 775 storage bootstrap/cache

# El plan gratuito conserva /home entre reinicios. SQLite queda fuera de la
# carpeta que GitHub Actions reemplaza durante cada despliegue.
if [[ "${DB_CONNECTION:-sqlite}" == "sqlite" ]]; then
    export DB_DATABASE="${DB_DATABASE:-$PERSISTENT_DATA_DIR/database.sqlite}"
    mkdir -p "$(dirname "$DB_DATABASE")"
    touch "$DB_DATABASE"
    chmod 664 "$DB_DATABASE"
fi

# App Service conserva /home entre reinicios. Las claves no se guardan en Git.
if [[ -z "${PASSPORT_PRIVATE_KEY:-}" || -z "${PASSPORT_PUBLIC_KEY:-}" ]]; then
    mkdir -p "$PASSPORT_KEYS_DIR"

    if [[ ! -f "$PASSPORT_KEYS_DIR/oauth-private.key" || ! -f "$PASSPORT_KEYS_DIR/oauth-public.key" ]]; then
        php artisan passport:keys --force --no-interaction
        mv storage/oauth-private.key "$PASSPORT_KEYS_DIR/oauth-private.key"
        mv storage/oauth-public.key "$PASSPORT_KEYS_DIR/oauth-public.key"
    fi

    ln -sfn "$PASSPORT_KEYS_DIR/oauth-private.key" storage/oauth-private.key
    ln -sfn "$PASSPORT_KEYS_DIR/oauth-public.key" storage/oauth-public.key
    chmod 600 "$PASSPORT_KEYS_DIR/oauth-private.key"
    chmod 644 "$PASSPORT_KEYS_DIR/oauth-public.key"
fi

php artisan migrate --force --no-interaction

if [[ "${RUN_DEMO_SEEDER:-false}" == "true" ]]; then
    php artisan db:seed \
        --class='Database\Seeders\DemoExpenseIntegrationSeeder' \
        --force \
        --no-interaction
fi

php artisan optimize
cp "$APP_ROOT/default" /etc/nginx/sites-available/default
service nginx reload
