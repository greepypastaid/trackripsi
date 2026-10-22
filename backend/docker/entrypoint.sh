#!/bin/sh
set -e

# Container must not ship the repo .env (isinya 127.0.0.1); config comes from compose env vars.
# `artisan serve` cuma meneruskan variabel yang tercantum di file .env, jadi file ini ditulis
# ulang dari env compose tiap start. Kalau menambah env baru di docker-compose.yml, tambahkan
# juga namanya di daftar bawah.
: > .env
for key in \
    APP_ENV APP_DEBUG APP_KEY APP_URL FRONTEND_URL \
    GOOGLE_CLIENT_ID GOOGLE_CLIENT_SECRET GOOGLE_REDIRECT_URI \
    DB_CONNECTION DB_HOST DB_PORT DB_DATABASE DB_USERNAME DB_PASSWORD \
    FILESYSTEM_DISK
do
    value=$(printenv "$key" || true)
    if [ -n "$value" ]; then
        escaped=$(printf '%s' "$value" | sed "s/'/'\\\\''/g")
        printf "%s='%s'\n" "$key" "$escaped" >> .env
    fi
done

php artisan config:clear >/dev/null 2>&1 || true
php artisan migrate --force

exec php artisan serve --host=0.0.0.0 --port=8000
