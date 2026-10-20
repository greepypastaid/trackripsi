# AGENTS.md

Petunjuk teknis untuk AI coding agent yang bekerja pada repositori Trackripsi.app.

## Project overview

Trackripsi.app adalah platform pelacak dan pengelola progres tugas akhir/skripsi mandiri untuk mahasiswa tingkat akhir. 

Karakteristik sistem:
- **Aktor tunggal**: Khusus mahasiswa (tanpa peran dosen pembimbing, penguji, atau admin prodi).
- **Multi-riset**: Satu akun pengguna dapat mengelola lebih dari satu proyek riset skripsi.
- **Fitur utama**: Autentikasi email/password, manajemen milestone bab skripsi (Bab 1–5/custom), to-do list terstruktur per tahapan, repositori draf berkas mandiri, dan catatan progres berkala.
- **Arsitektur**: Decoupled monorepo.
  - `frontend/`: React 19, Vite SPA, Tailwind CSS v4.
  - `backend/`: Laravel 12 (API only, PHP 8.4), Eloquent ORM, Laravel Sanctum.
  - `database/`: MariaDB 11.4.
  - `docker/`: Dockerfile produksi (Nginx, PHP-FPM) + konfigurasi `docker-compose.yml` / `docker-compose.prod.yml`.

## Golden rules

1. **Strict User Scoping**: Seluruh entitas riset, milestone, tugas, dan lampiran wajib terikat pada `user_id`. Cegah IDOR via Eloquent query scoping atau Policy checks di backend.
2. **Tanpa Fitur Approval/Review Eksternal**: Jangan membuat logic approval workflow, komentar dosen, atau role permission berjenjang. Sistem ini murni self-management tool.
3. **Autentikasi Sederhana**: Gunakan Bearer Token via Laravel Sanctum (email & password). Dilarang menambahkan SSO, OAuth kampus, LDAP, atau verifikasi SMS/WhatsApp.
4. **Tailwind CSS v4 Native**: Gunakan format konfigurasi CSS-first Tailwind v4 (`@import "tailwindcss";`). Jangan membuat file `tailwind.config.js`.
5. **No State Leaks**: Frontend SPA terpisah total dari backend. Jangan gunakan Blade view untuk logika aplikasi. Semua interaksi via REST API JSON.

## Build order

Jalankan pengembangan secara sekuensial:

```
[1. Repo & Docker Setup] 
       │
       ▼
[2. Backend Core: DB Schema, Sanctum Auth, Research Models]
       │
       ▼
[3. Backend API: CRUD Research, Milestones, Tasks, File Logs]
       │
       ▼
[4. Frontend Skeleton: React 19 Router, Auth Context, API Client]
       │
       ▼
[5. Frontend UI: Dashboard, Research Workspace, Milestone Tracker]
       │
       ▼
[6. Integrasi & End-to-End Validation]
```

- **Langkah 1**: Setup root workspace, Dockerfile untuk PHP 8.4 & Node 22, serta `docker-compose.yml`.
- **Langkah 2**: Inisialisasi Laravel 12 API, migrasi tabel (`users`, `researches`, `chapters`, `tasks`, `supervision_logs`, `action_items`, `document_drafts`), integrasi Sanctum.
- **Langkah 3**: Buat Form Requests, API Resource, Controller, dan Feature Tests untuk backend.
- **Langkah 4**: Inisialisasi Vite + React 19, Tailwind v4, setup layout dasar, auth state, dan HTTP client.
- **Langkah 5**: Implementasi UI dashboard riset, timeline milestone, board tugas, dan upload berkas mandiri.
- **Langkah 6**: Validasi kontrak API, handling edge case upload dokumen, linting, dan test pass.

## Commands

| Kategori | Tugas | Perintah |
| :--- | :--- | :--- |
| **Workspace** | Start semua container | `docker compose up -d` |
| | Start produksi | `docker compose -f docker-compose.prod.yml up -d --build` |
| | Stop container | `docker compose down` |
| **Backend** | Masuk shell backend | `docker compose exec backend sh` |
| | Install dependencies | `composer install` |
| | Jalankan migrasi DB | `php artisan migrate` |
| | Rollback & fresh seed | `php artisan migrate:fresh --seed` |
| | Format kode | `./vendor/bin/pint` |
| | Jalankan test | `php artisan test` |
| **Frontend** | Masuk shell frontend | `docker compose exec frontend sh` |
| | Install packages | `npm install` |
| | Jalankan dev server | `npm run dev` |
| | Build production | `npm run build` |
| | Linter check | `npm run lint` |

## Code conventions

### Struktur Direktori

```
trackripsi.app/
├── backend/
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/Api/   # Controller endpoint API
│   │   │   ├── Requests/          # Request validation
│   │   │   └── Resources/         # JSON transformers
│   │   ├── Models/                # Eloquent models
│   │   └── Policies/              # Otorisasi kepemilikan resource
│   ├── database/migrations/
│   └── tests/Feature/
├── frontend/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/            # Komponen atomik / shared UI
│   │   ├── features/              # Fitur modular (auth, research, tasks)
│   │   ├── hooks/                 # Custom React hooks
│   │   ├── layouts/               # Layout wrapper
│   │   ├── services/              # API wrapper/fetcher
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── vite.config.js
└── docker-compose.yml
```

### Konvensi Penamaan

- **Backend (PHP/Laravel)**:
  - Class & Controller: `PascalCase` (contoh: `ResearchController`, `TaskPolicy`).
  - Method & Property: `camelCase` (contoh: `getPendingTasks()`).
  - Kolom Database & JSON Response: `snake_case` (contoh: `user_id`, `target_date`, `is_completed`).
- **Frontend (JavaScript/React)**:
  - Komponen & File JSX: `PascalCase` (contoh: `MilestoneList.jsx`, `ResearchCard.jsx`).
  - Fungsi utilitas, hooks, variabel: `camelCase` (contoh: `useResearch`, `formatDate`).
  - CSS Classes: Utilitas Tailwind v4 standar.

### Error Handling & Responses

Backend wajib merespons dengan struktur format konsisten:

```json
// Berhasil (HTTP 200/201)
{
  "data": { ... }
}

// Gagal Validasi (HTTP 422)
{
  "message": "Data yang diberikan tidak valid.",
  "errors": {
    "title": ["Judul skripsi wajib diisi."]
  }
}

// Error Otorisasi / Server (HTTP 401/403/500)
{
  "message": "Akses tidak diizinkan."
}
```

Frontend wajib menangani kegagalan jaringan dan respons non-2xx dengan memunculkan umpan balik UI yang jelas (alert/toast state) tanpa memicu fatal crash.

## Definition of done

Sebelum menandai sebuah task selesai, pastikan kriteria berikut terpenuhi:

- [ ] Kode baru lolos linter tanpa error (`npm run lint` untuk FE, `./vendor/bin/pint` untuk BE).
- [ ] Backend API memiliki validasi FormRequest ketat untuk mutasi data (`POST`, `PUT`, `PATCH`).
- [ ] Model data terisolasi: user A tidak dapat membaca/mengubah data milik user B (status HTTP 403 dikembalikan).
- [ ] Fitur backend baru dilengkapi minimal satu PHPUnit/Pest Feature Test.
- [ ] Komponen frontend baru tidak memicu warning React di browser console.
- [ ] Frontend build berhasil dijalankan (`npm run build`) tanpa unresolved module.
- [ ] Environment variable baru terdokumentasi di `.env.example` frontend dan backend.

## Never do

- **Dilarang memasukkan logika dosen**: Jangan menambahkan kolom `lecturer_id`, `supervisor_notes`, atau status `approved_by_supervisor`.
- **Dilarang hardcode ID atau Secret**: Jangan meletakkan credential, secret key, atau database connection string langsung di dalam source code. Gunakan `.env`.
- **Dilarang mengembalikan TanStack/Next.js**: Stack resmi React 19 + Vite (folder `frontend/`), bukan Next.js.
- **Dilarang menggunakan file tailwind.config.js**: Frontend menggunakan Tailwind CSS v4. Simpan theme extension langsung di CSS entrypoint melalui directive `@theme`.
- **Dilarang mengizinkan IDOR**: Jangan pernah memanggil resource child langsung tanpa memvalidasi relasi `user_id` milik user yang sedang aktif. Contoh buruk: `Research::findOrFail($id)->delete()`. Contoh benar: `$request->user()->researches()->findOrFail($id)->delete()`.
- **Dilarang manipulasi DOM langsung**: Jangan gunakan `document.getElementById` atau jQuery di React 19. Gunakan standard state atau ref handlers.