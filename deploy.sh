#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"
COMPOSE="docker compose -f docker-compose.prod.yml"

git pull origin main
$COMPOSE build --pull
$COMPOSE up -d
$COMPOSE exec -T backend php artisan migrate --force
$COMPOSE exec -T backend php artisan optimize
docker image prune -f
