#!/bin/sh
set -e

# Container must not ship the repo .env (it points at 127.0.0.1); config comes from compose env vars.
# Truncate instead of delete: some tooling reads .env unconditionally and warns when it is absent.
: > .env

php artisan config:clear >/dev/null 2>&1 || true
php artisan migrate --force

exec php artisan serve --host=0.0.0.0 --port=8000
