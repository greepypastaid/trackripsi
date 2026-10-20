# Trackripsi.app

Aplikasi web pelacakan progres skripsi dan multi-riset mandiri untuk mahasiswa tingkat akhir.

## Why this exists

- Progres skripsi tercecer di catatan personal tanpa alur terstruktur -> Pelacakan bab, draf, dan target dalam satu dashboard terorganisasi.
- Kebutuhan kelola lebih dari satu topik riset/draf paralel -> Dukungan multi-riset per akun tanpa batasan sistem akademik.
- SIAKAD kampus birokratis dan lambat untuk evaluasi harian mandiri -> Ruang kerja privat, tanpa perlu akses dosen pembimbing atau birokrasi kampus.

## Tech stack

- **Frontend:** React 19, Vite, Tailwind CSS v4, shadcn/ui (radix-nova preset)
- **Backend:** Laravel 12, Eloquent ORM, Laravel Sanctum (PHP 8.4)
- **Database:** MariaDB 11.4
- **Deployment:** Docker, Docker Compose, Nginx, VPS Linux

## Getting started

### Prerequisites

- Node.js >= 20.x
- PHP >= 8.4 & Composer
- Docker & Docker Compose (opsional untuk lokal, utama untuk deploy)
- MariaDB >= 11.4

### Environment variables

Salin berkas konfigurasi environment pada direktori API dan Client:

```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env

# Docker Compose (root)
cp .env.example .env && docker compose run --rm backend php artisan key:generate --show
```

Variabel kunci pada `backend/.env`:
```env
APP_NAME="Trackripsi.app"
APP_ENV=local
APP_KEY=
APP_DEBUG=true
APP_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=trackripsi_manager
DB_USERNAME=root
DB_PASSWORD=secret
```

Variabel kunci pada `frontend/.env`:
```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

### Install and run (Local manual)

1. Jalankan Backend:
```bash
cd backend
composer install
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

2. Jalankan Frontend:
```bash
cd frontend
npm install
npm run dev
```

### Install and run (Docker compose)

Jalankan seluruh stack development (MariaDB, Backend, Frontend):
```bash
cp .env.example .env      # isi APP_KEY hasil `php artisan key:generate --show`
docker compose up -d --build
```

Backend menjalankan migrasi otomatis saat container start.

Deployment produksi:
```bash
docker compose -f docker-compose.prod.yml up -d --build
./deploy.sh               # pull + build + migrate --force + optimize
```

Aplikasi aktif pada:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000/api/v1`
- Health check: `http://localhost:8000/api/v1/health`
- Akun demo (setelah `migrate --seed`): `demo@skripsi.test` / `password123`

## Project structure

```text
trackripsi.app/
├── backend/                # Backend Laravel 12 (REST API, PHP 8.4)
│   ├── app/                # Controllers, Models, Requests, Policies
│   ├── config/             # Konfigurasi aplikasi backend
│   ├── database/           # Migrations, factories, seeders
│   ├── routes/             # Definisi rute API (api.php)
│   └── tests/              # Automated tests backend
├── frontend/               # Frontend React 19 (Vite SPA)
│   ├── public/             # Aset statis
│   └── src/
│       ├── components/     # UI components reusable
│       ├── hooks/          # Auth context
│       ├── layouts/        # Layout wrapper
│       ├── pages/          # View halaman rute
│       └── services/       # API client + TanStack Query hooks
├── docker/                 # Dockerfile frontend produksi + Nginx server block
├── docker-compose.yml      # Orchestration development
├── docker-compose.prod.yml # Orchestration produksi
├── deploy.sh               # Skrip deploy VPS
├── PLAN.md                 # Rencana arsitektur dan eksekusi
└── README.md               # Dokumentasi utama proyek
```

## Scripts

Tabel script eksekusi pada direktori `frontend/`:

| Command | Fungsi |
| :--- | :--- |
| `npm run dev` | Menjalankan local development server Vite. |
| `npm run build` | Kompilasi source code ke berkas bundle production di `frontend/dist`. |
| `npm run preview` | Menjalankan preview lokal dari hasil direktori `dist`. |
| `npm run lint` | Menjalankan oxlint (tanpa warning blocking). |

Script backend (dijalankan di `backend/`):

| Command | Fungsi |
| :--- | :--- |
| `php artisan migrate` | Eksekusi migrasi skema basis data. |
| `php artisan test` | Menjalankan suite pengujian backend (Pest). |
| `./vendor/bin/pint` | Format kode PHP. |

## API endpoints

Base URL `/api/v1`. Detail kontrak lengkap ada di [TECH_STACK.md](TECH_STACK.md#4-api-contract).

| Method | Path | Fungsi |
| :--- | :--- | :--- |
| `POST` | `/auth/register`, `/auth/login` | Autentikasi (rate limit 5/menit untuk login) |
| `GET` | `/auth/me`, `POST /auth/logout` | Profil & revoke token |
| `GET/POST` | `/researches` | Daftar & buat riset (auto-generate Bab 1–5) |
| `GET/PATCH/DELETE` | `/researches/{id}` | Detail, ubah, hapus riset |
| `GET` | `/researches/{id}/summary` | Metrik progres agregat |
| `POST` | `/researches/{id}/chapters` | Tambah bab kustom |
| `PATCH/DELETE` | `/chapters/{id}` | Ubah status/judul bab |
| `POST` | `/chapters/{id}/tasks` | Tambah sub-tugas |
| `PATCH` | `/tasks/{id}/toggle` | Toggle checklist (recalculate progres) |
| `GET/POST` | `/researches/{id}/logs` | Log bimbingan mandiri |
| `POST` | `/logs/{id}/convert-action-items` | Konversi poin revisi jadi checklist |
| `POST` | `/chapters/{id}/drafts` | Upload draf PDF/DOCX (maks 15MB) |
| `GET` | `/documents/{id}/download` | Unduh draf (terproteksi auth) |
| `GET` | `/health` | Status koneksi database |

## Roadmap

Detail tahapan pengembangan dan pelacakan fitur:
- Perencanaan arsitektur: [PLAN.md](PLAN.md)
- Roadmap fitur lengkap: [docs/ROADMAP.md](docs/ROADMAP.md)

## License

MIT License. Hak cipta dilindungi. Bebas digunakan untuk pengembangan personal.