#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"
COMPOSE="docker compose -f docker-compose.prod.yml"

# --- Preflight: gagal cepat sebelum container disentuh -----------------------
[[ -f .env ]] || { echo "✗ .env root belum ada. Copy dari .env.example lalu isi."; exit 1; }
grep -qE '^APP_KEY=.+$' .env || { echo "✗ APP_KEY kosong di .env (generate: php artisan key:generate --show)."; exit 1; }
grep -qE '^APP_URL=https://' .env || echo "⚠ APP_URL bukan https:// — login Google akan gagal (redirect_uri_mismatch)."
grep -qE '^GOOGLE_CLIENT_SECRET=.+$' .env || echo "⚠ GOOGLE_CLIENT_SECRET kosong — tombol Google akan menolak login."
grep -qE '^GOOGLE_REDIRECT_URI=https://' .env || echo "⚠ GOOGLE_REDIRECT_URI bukan https:// — Google menolak redirect URI non-localhost."

git pull origin main

# --- Build & up --------------------------------------------------------------
$COMPOSE build --pull
$COMPOSE up -d

# --- Migrasi, cache, lalu verifikasi ----------------------------------------
$COMPOSE exec -T backend php artisan migrate --force
$COMPOSE exec -T backend php artisan optimize
$COMPOSE exec -T backend php artisan route:list --path=google >/dev/null

echo "→ cek health endpoint…"
for i in $(seq 1 10); do
  if curl -fsS "http://localhost/up" >/dev/null 2>&1; then
    echo "✓ health ok"
    break
  fi
  if [[ $i -eq 10 ]]; then
    echo "✗ health endpoint gagal — cek: $COMPOSE logs --tail=50 backend"
    exit 1
  fi
  sleep 2
done

docker image prune -f
echo "✓ deploy selesai"
