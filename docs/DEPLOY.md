# Deploy Trackripsi ke Server

Checklist produksi. Asumsi: Docker + Docker Compose terpasang, domain sudah mengarah ke server.

## 1. Google Cloud Console (lakukan SEBELUM deploy)

1. **Clients → client kamu → Authorized redirect URIs**, tambahkan:
   ```
   https://domainkamu.com/api/v1/auth/google/callback
   ```
   Jangan hapus URI localhost kalau masih dipakai untuk development.
2. **Audience**: klik **Publish app** (kalau masih Testing, hanya 100 test user yang bisa login).
3. Google mensyaratkan HTTPS untuk domain non-localhost. Server wajib punya TLS.

## 2. `.env` di server

```env
APP_URL=https://domainkamu.com
FRONTEND_URL=https://domainkamu.com
APP_KEY=base64:...            # php artisan key:generate --show
DB_DATABASE=trackripsi
DB_USERNAME=trackripsi
DB_PASSWORD=<password kuat>
DB_ROOT_PASSWORD=<password kuat>
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx
GOOGLE_REDIRECT_URI=https://domainkamu.com/api/v1/auth/google/callback
TRUSTED_PROXIES=*
```

Catatan:
- `FRONTEND_URL` boleh berisi beberapa origin dipisah koma (dipakai CORS); redirect Google hanya memakai origin pertama.
- `APP_DEBUG` sudah dipaksa `false` dan `APP_ENV=production` oleh `docker-compose.prod.yml`.
- `backend/.env` **tidak** ikut ke image (lihat `backend/.dockerignore`); konfigurasi hanya dari env compose.

## 3. TLS

Container `web` hanya listen port 80. Pilih salah satu:

- **Cloudflare** (paling cepat): proxy ON (centang oranye), SSL/TLS mode **Full**. `TRUSTED_PROXIES=*` sudah aman karena Laravel membaca `X-Forwarded-Proto` dari Cloudflare.
- **Caddy di depan** sebagai reverse proxy `domainkamu.com` → `localhost:80`, sertifikat otomatis.
- **Certbot/nginx host** dengan proxy ke `localhost:80`.

Tanpa TLS: login Google gagal `redirect_uri_mismatch`, dan token Bearer terkirim tanpa enkripsi.

## 4. Deploy

```bash
git clone <repo> && cd trackripsi
cp .env.example .env      # lalu isi seperti langkah 2
./deploy.sh
```

`deploy.sh` melakukan: preflight env → `git pull` → build → up → migrate → optimize → cek `/up`.

## 5. Verifikasi setelah deploy

```bash
# API hidup & DB terhubung
curl -fsS https://domainkamu.com/up

# route Google terdaftar
docker compose -f docker-compose.prod.yml exec -T backend php artisan route:list --path=google

# kolom google_id ada
docker compose -f docker-compose.prod.yml exec -T backend \
  php artisan tinker --execute="echo Schema::hasColumn('users','google_id') ? 'ok' : 'missing';"
```

Lalu uji manual: buka `https://domainkamu.com/login` → **Lanjutkan dengan Google** → harus mendarat di dashboard.

## 6. Kalau login Google gagal di produksi

| Pesan | Artinya |
| :--- | :--- |
| `redirect_uri_mismatch` (dari Google) | URI di Console ≠ `GOOGLE_REDIRECT_URI`, atau `APP_URL` masih http |
| `invalid_client` | `GOOGLE_CLIENT_SECRET` salah/terpotong |
| `Token login ditolak server (401)` | DB produksi belum dimigrasi, atau `APP_KEY` berubah |
| `Server gagal menyimpan akun (kolom google_id...)` | `php artisan migrate --force` belum jalan |
| `Sesi login Google kedaluwarsa` | state >10 menit atau `CACHE_STORE` tidak konsisten antar instance |

Log: `docker compose -f docker-compose.prod.yml logs --tail=100 backend`.

## 7. Operasional

- Migrasi otomatis saat deploy; image produksi tidak menjalankan migrasi di entrypoint.
- Backup: volume `db_data` (MariaDB) dan `storage_data` (berkas upload).
- Rotasi `GOOGLE_CLIENT_SECRET`: **Clients → Add secret** → update `.env` → `./deploy.sh` → disable secret lama.
