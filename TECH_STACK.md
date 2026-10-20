# Technical Specification — Skripsi Manager

## 1. Stack overview

| Komponen | Teknologi | Versi | Alasan Penggunaan |
| :--- | :--- | :--- | :--- |
| **Frontend Runtime** | React | 19.x | State management terkini, Server Actions/Optimistic UI support. |
| **Build Tool** | Vite | 6.x | Bundler cepat, HMR native ESM. |
| **Styling** | Tailwind CSS | 4.x | Utility-first CSS, engine baru berbasis Rust (@theme directive native). |
| **Backend Framework**| Laravel | 12.x | REST API scaffolding cepat, ekosistem auth matang. |
| **Language Runtime** | PHP | 8.4 | Fitur typed properties, read-only classes, performa OPcache. |
| **Database** | MariaDB | 11.4 | Relational DB standar, integritas referensial ACID. |
| **ORM** | Eloquent ORM | Bawaan Laravel | Abstraksi query ringkas, validasi relasi otomatis via migration/model. |
| **Authentication** | Laravel Sanctum | Bawaan Laravel | Token-based auth (SPA stateful cookie/bearer token), minim konfigurasi. |
| **Deployment** | Docker & Compose | Latest | Kontainerisasi multi-stage build, konsistensi staging-production VPS. |
| **Web Server** | Nginx (Alpine) | 1.25+ | Reverse proxy frontend SPA & backend PHP-FPM. |

## 2. Architecture

Arsitektur decouple client-server:

```
[Browser / Client]
       │
       ▼
 [Nginx Reverse Proxy]
   ├── /api/*  ──────────> [Laravel PHP-FPM API] ───> [MySQL DB]
   │                              │
   │                              └──> [Local Volume: /storage]
   └── /*      ──────────> [React 19 SPA (Static Files)]
```

- **Autentikasi:** State-less Bearer token menggunakan Laravel Sanctum.
- **Frontend SPA:** Single Page Application independen. Mengambil data via `fetch` / standard HTTP client ke `/api/v1`.
- **Database Storage:** Relasional penuh, foreign key cascade delete per entitas induk. Berkas dokumen tersimpan di Docker volume `/var/www/html/storage/app/public`.
- **User Scope:** Isolasi data total via `user_id` pada seluruh entitas `researches`.

## 3. Data model

```sql
-- Skema Database Skripsi Manager

CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE researches (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    title VARCHAR(500) NOT NULL,
    faculty VARCHAR(255) NULL,
    department VARCHAR(255) NULL,
    target_completion_date DATE NULL,
    status ENUM('proposal', 'research', 'writing', 'defense', 'completed') DEFAULT 'proposal',
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    CONSTRAINT fk_researches_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_status (user_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE chapters (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    research_id BIGINT UNSIGNED NOT NULL,
    chapter_number TINYINT UNSIGNED NOT NULL,
    title VARCHAR(255) NOT NULL,
    status ENUM('not_started', 'drafting', 'revising', 'done') DEFAULT 'not_started',
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    CONSTRAINT fk_chapters_research FOREIGN KEY (research_id) REFERENCES researches(id) ON DELETE CASCADE,
    UNIQUE KEY uq_research_chapter (research_id, chapter_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE tasks (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    chapter_id BIGINT UNSIGNED NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    due_date DATE NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    CONSTRAINT fk_tasks_chapter FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE,
    INDEX idx_chapter_task (chapter_id, is_completed)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE documents (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    research_id BIGINT UNSIGNED NOT NULL,
    chapter_id BIGINT UNSIGNED NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT UNSIGNED NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    version INT UNSIGNED DEFAULT 1,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    CONSTRAINT fk_documents_research FOREIGN KEY (research_id) REFERENCES researches(id) ON DELETE CASCADE,
    CONSTRAINT fk_documents_chapter FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE progress_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    research_id BIGINT UNSIGNED NOT NULL,
    activity_description TEXT NOT NULL,
    log_date DATE NOT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    CONSTRAINT fk_progress_research FOREIGN KEY (research_id) REFERENCES researches(id) ON DELETE CASCADE,
    INDEX idx_research_date (research_id, log_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## 4. API contract

Base URL: `/api/v1`  
Header wajib request: `Accept: application/json`, `Authorization: Bearer <token>` (kecuali endpoint Auth publik).

| Method | Path | Tujuan | Request Body Shape | Response Body Shape |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Pendaftaran akun mahasiswa | `{"name":"str","email":"str","password":"str","password_confirmation":"str"}` | `{"token":"str","user":{"id":1,"name":"str","email":"str"}}` |
| `POST` | `/auth/login` | Login & ambil API token | `{"email":"str","password":"str"}` | `{"token":"str","user":{"id":1,"name":"str","email":"str"}}` |
| `POST` | `/auth/logout` | Revoke active token | *Kosong* | `{"message":"Logged out"}` |
| `GET` | `/researches` | List semua skripsi milik user | *Kosong* | `{"data":[{"id":1,"title":"str","status":"str","target_completion_date":"YYYY-MM-DD"}]}` |
| `POST` | `/researches` | Buat tracking skripsi baru | `{"title":"str","faculty":"str?","department":"str?","target_completion_date":"YYYY-MM-DD?"}` | `{"data":{"id":1,"title":"str","status":"proposal"}}` |
| `GET` | `/researches/{id}` | Detail skripsi, progress, & bab | *Kosong* | `{"data":{"id":1,"title":"str","chapters":[...],"progress_percentage":40}}` |
| `PATCH` | `/researches/{id}` | Update metadata / status | `{"title":"str?","status":"str?","target_completion_date":"YYYY-MM-DD?"}` | `{"data":{"id":1,"title":"str","status":"research"}}` |
| `DELETE`| `/researches/{id}` | Hapus data skripsi | *Kosong* | `{"message":"Research deleted"}` |
| `POST` | `/researches/{id}/chapters` | Tambah bab kustom | *Kosong* | `{"data":[{"id":1,"chapter_number":1,"title":"Pendahuluan","status":"drafting"}]}` |
| `PATCH` | `/chapters/{id}` | Update judul/status/urutan bab | `{"title":"str?","status":"drafting\|revising\|done"}` | `{"data":{"id":1,"chapter_number":1,"status":"revising"}}` |
| `POST` | `/chapters/{id}/tasks` | Tambah task per bab | `{"title":"str","description":"str?","due_date":"YYYY-MM-DD?"}` | `{"data":{"id":1,"title":"str","is_completed":false}}` |
| `PATCH` | `/tasks/{id}/toggle` | Ubah status checklist task | *Kosong* | `{"data":{"id":1,"is_completed":true}}` |
| `DELETE`| `/tasks/{id}` | Hapus task | *Kosong* | `{"message":"Task deleted"}` |
| `POST` | `/researches/{id}/documents` | Unggah draft dokumen | `multipart/form-data`: `file`, `chapter_id?`, `version?` | `{"data":{"id":1,"file_name":"str","file_path":"str"}}` |
| `GET` | `/documents/{id}/download` | Unduh draf dokumen (auth) |
| `POST` | `/logs/{id}/convert-action-items` | Konversi poin revisi ke checklist bab |
| `GET` | `/researches/{id}/summary` | Metrik progres agregat |
| `GET` | `/health` | Health check koneksi database | *Kosong* | Binary file stream |
| `GET` | `/researches/{id}/logs` | List log bimbingan mandiri | *Kosong* | `{"data":[{"id":1,"activity_description":"str","log_date":"YYYY-MM-DD"}]}` |
| `POST` | `/researches/{id}/logs` | Tambah log bimbingan | `{"activity_description":"str","log_date":"YYYY-MM-DD"}` | `{"data":{"id":1,"activity_description":"str","log_date":"YYYY-MM-DD"}}` |

## 5. Environment variables

### Backend (Laravel - `.env`)

| Variable Name | Required | Deskripsi |
| :--- | :--- | :--- |
| `APP_NAME` | Ya | Nama instance, set: `SkripsiManager` |
| `APP_ENV` | Ya | Environment runtime (`local` / `production`) |
| `APP_KEY` | Ya | Kunci enkripsi AES-256 (generate via `php artisan key:generate`) |
| `APP_DEBUG` | Ya | Status debug mode (`false` di production) |
| `APP_URL` | Ya | Domain URL backend API |
| `FRONTEND_URL` | Ya | URL origin SPA frontend untuk setup CORS |
| `DB_CONNECTION` | Ya | Driver database, set: `mysql` |
| `DB_HOST` | Ya | Host database container / host IP (`mysql` di docker) |
| `DB_PORT` | Ya | Port MySQL, default: `3306` |
| `DB_DATABASE` | Ya | Nama database |
| `DB_USERNAME` | Ya | User database |
| `DB_PASSWORD` | Ya | Password database |
| `SANCTUM_STATEFUL_DOMAINS` | Tidak | Kosongkan jika pakai pure Bearer token |
| `FILESYSTEM_DISK` | Ya | Lokasi simpan file, set: `local` (privat, disajikan via rute terproteksi) |

### Frontend (React/Vite - `.env`)

| Variable Name | Required | Deskripsi |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Ya | URL basis endpoint REST API (contoh: `https://api.skripsi.domain/api/v1`) |

## 6. Configuration & tooling

### Frontend Setup
- **Node.js:** Versi `>= 20.x LTS`
- **Tailwind v4 Configuration:**
  Import pada file stylesheet root `src/index.css`:
  ```css
  @import "tailwindcss";

  @theme {
    --color-brand-primary: #2563eb;
    --color-brand-secondary: #0f172a;
  }
  ```
- **Vite:** Menggunakan plugin `@vitejs/plugin-react`.
- **Scripts `package.json`:**
  - `dev`: `vite`
  - `build`: `vite build`
  - `preview`: `vite preview`

### Backend Setup
- **PHP:** `8.4` dengan ekstensi: `pdo_mysql`, `mbstring`, `bcmath`, `xml`, `curl`.
- **CORS Configuration (`config/cors.php`):**
  - Izinkan `allowed_origins` dari environment `FRONTEND_URL`.
  - Izinkan header `Authorization`, `Content-Type`, `Accept`.
- **File Upload Limits (`php.ini`):**
  - `upload_max_filesize = 25M`
  - `post_max_size = 30M`

### Docker Deployment Setup
`docker-compose.yml` multi-container:

```yaml
services:
  app:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    restart: unless-stopped
    volumes:
      - storage_data:/var/www/html/storage/app/public
    environment:
      - APP_ENV=production
    networks:
      - internal_net

  web:
    image: nginx:alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./frontend/dist:/usr/share/nginx/html:ro
      - ./nginx/default.conf:/etc/nginx/conf.d/default.conf:ro
      - storage_data:/var/www/html/storage/public:ro
    depends_on:
      - app
    networks:
      - internal_net

  mysql:
    image: mariadb:11.4
    restart: unless-stopped
    environment:
      MYSQL_DATABASE: ${DB_DATABASE}
      MYSQL_USER: ${DB_USERNAME}
      MYSQL_PASSWORD: ${DB_PASSWORD}
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
    volumes:
      - db_data:/var/lib/mysql
    networks:
      - internal_net

volumes:
  db_data:
  storage_data:

networks:
  internal_net:
    driver: bridge
```

## 7. Observability & error handling

### Error Handling Standard
- **HTTP Payload Standar Response Gagal:**
  ```json
  {
    "message": "Deskripsi kesalahan human-readable.",
    "errors": {
      "field_name": ["Detail validasi error."]
    }
  }
  ```
- **Status Code Mapping:**
  - `400 Bad Request`: Payload rusak atau format tidak tepat.
  - `401 Unauthorized`: Token kedaluwarsa atau tidak disertakan.
  - `403 Forbidden`: Akses resource skripsi milik user lain.
  - `404 Not Found`: Data ID tidak ada di database.
  - `422 Unprocessable Content`: Validasi input Laravel gagal (`FormRequest`).
  - `500 Internal Server Error`: Bug logika internal / DB exception down.

### Client-side Handling
- Gunakan React Error Boundary di tingkat layout utama untuk tangkap crash fatal UI.
- Interceptor response fetch: Bila menerima kode `401`, hapus local token dan redirect paksa ke `/login`.

### Logging & Monitoring
- **Laravel Logging:** Driver `daily` diarahkan ke `storage/logs/laravel-{date}.log`. Retention diset 14 hari.
- **Log Format:** JSON structured log untuk error level `ERROR` dan `CRITICAL`.
- **Health Check Endpoint:** `GET /api/v1/health` mengembalikan status database connection (`200 OK` atau `503 Service Unavailable`). Digunakan monitor uptime VPS.