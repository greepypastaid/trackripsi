# Execution Plan — Trackripsi.app

Panduan eksekusi end-to-end pembangunan aplikasi personal tracking skripsi mahasiswa.

---

## Milestone 0: Setup & Design Tokens

Inisialisasi repositori, konfigurasi runtime, dan standardisasi design tokens.

### Tugas
- [ ] Inisialisasi struktur repositori:
  ```
  trackripsi.app/
  ├── frontend/      # Vite + React 19 + Tailwind v4
  ├── backend/       # Laravel 12 + Sanctum (PHP 8.4)
  ├── docker/        # Dockerfile produksi, Nginx server block
  └── README.md
  ```
- [ ] Setup frontend workspace:
  - Inisialisasi React 19 via `npm create vite@latest frontend -- --template react-ts`.
  - Pasang dependencies inti: `@tailwindcss/vite`, `clsx`, `tailwind-merge`, `lucide-react`.
  - Konfigurasi `@import "tailwindcss";` pada `frontend/src/index.css`.
- [ ] Definisikan custom theme & tokens di `frontend/src/index.css` via `@theme`:
  - Brand colors: `brand-blue-500` (#2563eb), `brand-blue-600` (#1d4ed8), `surface-dark` (#0f172a).
  - Status colors: `status-todo` (#94a3b8), `status-progress` (#38bdf8), `status-done` (#22c55e), `status-blocked` (#ef4444).
- [ ] Setup backend Laravel:
  - Buat project: `composer create-project laravel/laravel server`.
  - Pasang Laravel Sanctum: `php artisan install:api`.
  - Konfigurasi `.env` untuk koneksi MariaDB lokal dan URL CORS `http://localhost:5173`.
- [ ] Setup environment Docker Compose lokal (`docker-compose.dev.yml`):
  - Service `mariadb:11.4` dengan healthcheck aktif.
  - Service `phpmyadmin` (opsional untuk audit visual database).

### Definition of Done
- Local development servers frontend (`:5173`) dan backend (`:8000`) berjalan tanpa error.
- Tailwind v4 utility classes dan token warna terbaca di React component.
- Koneksi database Laravel ke MariaDB via CLI `php artisan db:monitor` menghasilkan status `OK`.

---

## Milestone 1: Frontend Skeleton (Mock Data)

Bangun antarmuka interaktif yang dapat diklik penuh menggunakan in-memory state sebelum backend terhubung.

### Tugas
- [ ] Setup router menggunakan `react-router-dom`:
  - `/login` & `/register` (Auth view).
  - `/researches` (Research Switcher / Dashboard).
  - `/researches/:id/overview` (Ringkasan progres & target jadwal).
  - `/researches/:id/chapters` (Kanban / Checklist Bab 1-6).
  - `/researches/:id/logs` (Jurnal bimbingan mandiri & revisi).
  - `/researches/:id/files` (Koleksi draft dokumen & referensi).
- [ ] Buat Mock Data Factory (`frontend/src/mocks/`):
  - `mockResearches`: Daftar judul skripsi aktif/arsip per user.
  - `mockChapters`: Progres per bab (Bab 1 s/d Bab 5/6, status, bobot %).
  - `mockTasks`: To-do list mikro per bab dengan tag revisi.
  - `mockLogs`: Riwayat tanggal bimbingan, catatan dosen, checklist evaluasi mandiri.
- [ ] Implementasi UI Components & Layout:
  - `AppLayout`: Sidebar navigasi, breadcrumbs, dropdown switch judul skripsi.
  - `ProgressBar`: Indikator persentase penyelesaian skripsi total & per-bab.
  - `ChapterList`: Accordion view detail per bab beserta list task di dalamnya.
  - `LogTimeline`: Visual timeline riwayat konsultasi.
- [ ] Tambahkan mock state interactivity:
  - Create/Select research via context/state.
  - Toggle checklist task mengubah nilai kalkulasi progres secara reaktif di view.

### Definition of Done
- Semua rute dapat diakses dan interaktif tanpa network error.
- Pengguna dapat membuat judul skripsi baru (mock), menambah task, centang checklist, dan progres bar bergerak secara real-time.

---

## Milestone 2: API & Database Schema

Rancang schema database, relasi Eloquent, dan endpoint REST API.

### Database Schema

| Table | Kolom Kunci | Relasi / Keterangan |
| :--- | :--- | :--- |
| `users` | `id`, `name`, `email`, `password` | Akun mahasiswa |
| `researches` | `id`, `user_id`, `title`, `field`, `target_date`, `status` | FK to `users.id` (1 User : N Researches) |
| `chapters` | `id`, `research_id`, `title`, `order`, `status`, `progress_percent` | FK to `researches.id` (Bab 1, Bab 2, dst.) |
| `chapter_tasks` | `id`, `chapter_id`, `description`, `is_completed`, `due_date` | FK to `chapters.id` |
| `supervision_logs`| `id`, `research_id`, `session_date`, `notes`, `feedback`, `action_items` | FK to `researches.id` (Log mandiri catatan dosen) |
| `research_files` | `id`, `research_id`, `file_name`, `file_path`, `file_type`, `size_bytes`| FK to `researches.id` (Penyimpanan metadata file) |

### Tugas
- [ ] Generate migrations dan definisikan constraint database (foreign keys `onDelete('cascade')`, index pada `user_id` & `research_id`).
- [ ] Buat Eloquent Models:
  - `User`, `Research`, `Chapter`, `ChapterTask`, `SupervisionLog`, `ResearchFile`.
  - Pasang property `$fillable`, cast type (`target_date` -> `date`, `is_completed` -> `boolean`).
- [ ] Buat Form Requests untuk validasi ketat:
  - `AuthRequest`, `ResearchStoreRequest`, `ChapterTaskUpdateRequest`, `SupervisionLogStoreRequest`.
- [ ] Terapkan Policy Authorization:
  - `ResearchPolicy`: Memastikan user hanya bisa membaca, mengubah, dan menghapus riset milik sendiri.
- [ ] Bangun API Controllers & JSON Resources:
  - `AuthController`: register, login, logout, me.
  - `ResearchController`: CRUD + summary dashboard stats.
  - `ChapterController`: Update status bab & recalculate aggregate.
  - `TaskController`: Batch update task & status toggle.
  - `SupervisionLogController`: CRUD catatan bimbingan.
  - `FileController`: Upload berkas skripsi lokal (`storage/app/public/researches/`).

### Definition of Done
- Migrasi berjalan lancar via `php artisan migrate:fresh`.
- Automated test endpoint (`php artisan test`) memverifikasi proteksi data antar user: User B menerima response `403 Forbidden` jika mengakses `research_id` milik User A.

---

## Milestone 3: Integration & Business Logic

Hubungkan React frontend dengan Laravel backend API, gantikan mock system.

### Tugas
- [ ] Konfigurasi API Client di Frontend:
  - Setup wrapper `fetch` atau `axios` dengan base URL runtime.
  - Token interceptor: sematkan Bearer Token dari `localStorage`/cookie di setiap HTTP header.
  - Global error handler untuk menangani response `401 Unauthorized` (redirect ke `/login`) dan error validasi `422`.
- [ ] State Management & Data Fetching:
  - Implementasi `@tanstack/react-query` untuk queries dan mutations.
  - Pasang query cache keys: `['researches']`, `['chapters', researchId]`, `['logs', researchId]`.
  - Optimistic updates saat mencentang `ChapterTask` agar responsif tanpa latency visual.
- [ ] Logika Progres Otomatis:
  - Buat listener/observer backend: Tiap kali `ChapterTask` diupdate, hitung ulang `chapters.progress_percent` dan agregat progres total di `researches`.
- [ ] Upload & Download File:
  - Form upload PDF/DOCX draft bab via `multipart/form-data`.
  - Handler sanitasi nama file dan batasan ukuran maks 20MB di Laravel.
  - UI file viewer/downloader langsung dari storage.
- [ ] Export Log Bimbingan:
  - Endpoint export riwayat bimbingan ke format print-friendly HTML/PDF untuk lembar rekap mandiri.

### Definition of Done
- Seluruh mock data dihapus, aplikasi sepenuhnya membaca dan menulis data ke MariaDB via API.
- Mengunggah file berkas bab berhasil tersimpan di backend storage dan dapat diunduh kembali dari UI.
- State sinkron: Refresh browser mempertahankan sesi autentikasi dan status progres skripsi.

---

## Milestone 4: QA, Deployment & Polish

Validasi stabilitas, optimasi ukuran bundle, containerization, dan peluncuran production.

### Tugas
- [ ] Audit & Defensive UX:
  - Sediakan UI `EmptyState` jika user baru mendaftar dan belum memiliki data riset/log.
  - Tampilkan `SkeletonLoader` pada saat transisi loading data.
  - Pasang React Error Boundary untuk isolasi crash komponen.
- [ ] Containerization:
  - `backend/Dockerfile.prod`: Multi-stage PHP 8.4 FPM image + Composer + OPcache + extensions (`pdo_mysql`, `mbstring`, `zip`).
  - `docker/Dockerfile.frontend`: Multi-stage Node.js build -> output statis dilayani oleh Nginx Alpine.
  - `docker-compose.prod.yml`: Konfigurasi reverse proxy Nginx, Backend, Frontend, MariaDB, dan volume storage persisten.
- [ ] Script Otomasi Deploy (`deploy.sh`):
  ```bash
  git pull origin main
  docker compose -f docker-compose.prod.yml build --no-cache
  docker compose -f docker-compose.prod.yml up -d
  docker compose -f docker-compose.prod.yml exec backend php artisan migrate --force
  docker compose -f docker-compose.prod.yml exec backend php artisan optimize
  ```
- [ ] Hardening Keamanan Server:
  - Konfigurasi `APP_DEBUG=false` di environment production.
  - Set rate limiter pada route login: `throttle:5,1`.
  - Pasang CORS whitelist spesifik hanya ke domain frontend production.
  - Set file permissions tepat: `chmod -R 775 storage bootstrap/cache`.

### Definition of Done
- Seluruh container berjalan dalam status `healthy` via `docker ps` pada VPS target.
- Pengujian flow utuh berhasil diakses publik via HTTPS: Registrasi -> Buat Research -> Input Bab & Task -> Catat Log Bimbingan -> Upload Dokumen.
- Lighthouse performance score frontend mencapai minimal nilai 90.