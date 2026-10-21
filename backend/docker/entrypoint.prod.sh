#!/bin/sh
set -e

# Named volume `storage_data` dipasang sebagai root:root saat pertama kali dibuat.
# php-fpm worker jalan sebagai www-data, jadi kepemilikan harus diperbaiki tiap start
# (idempoten, hanya menyentuh path storage yang kecil).
mkdir -p storage/app/private/drafts storage/framework/cache storage/framework/sessions storage/framework/views storage/logs
chown -R www-data:www-data storage bootstrap/cache

exec "$@"
