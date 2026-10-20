# Roadmap

## Milestone 1: Inisialisasi Proyek & Autentikasi Pengguna
### Backend Scaffold & Basis Data
- [x] Inisialisasi proyek Laravel 12 + Sanctum dengan struktur RESTful API murni.
- [ ] Konfigurasi koneksi database MySQL/MariaDB pada `.env`.
- [ ] Pasang dan konfigurasi Laravel Sanctum untuk token-based authentication (SPA-friendly).
- [ ] Buat migrasi tabel `users` dan skema dasar profil mahasiswa.
- [ ] Siapkan seeder awal untuk akun testing lokal.

### Frontend Scaffold & UI Setup
- [ ] Inisialisasi React 19 SPA menggunakan Vite (`vite.config.ts`).
- [ ] Pasang dan konfigurasi Tailwind CSS v4 menggunakan directive `@import "tailwindcss";`.
- [ ] Siapkan routing client-side menggunakan `react-router-dom` v6+.
- [ ] Pasang HTTP client Axios dengan interseptor Bearer token dan auto-redirect `401 Unauthorized`.
- [ ] Buat layout global: `AuthLayout` dan `DashboardLayout` (sidebar, header, content canvas).

### Sistem Autentikasi
- [ ] Buat endpoint Laravel API: `POST /api/register`, `POST /api/login`, `POST /api/logout`, dan `GET /api/me`.
- [ ] Implementasi validasi form registrasi dan login menggunakan Laravel Form Request.
- [ ] Bangun antarmuka form register dan login pada React dengan validasi state input.
- [ ] Implementasi state auth global menggunakan React Context atau library state manajemen minimalis.
- [ ] Konfigurasi route guard `ProtectedRoute` untuk mencegah akses unauthenticated ke dashboard.

## Milestone 2: Manajemen Workspace Penelitian (Multi-Research)
### Skema Data Penelitian & Relasi
- [ ] Buat migration tabel `researches` (kolom: `id`, `user_id`, `title`, `abstract`, `field_of_study`, `start_date`, `target_defense_date`, `status`, `created_at`, `updated_at`).
- [ ] Buat Eloquent Model `Research` dengan relasi `belongsTo(User::class)`.
- [ ] Buat migration tabel `chapters` (kolom: `id`, `research_id`, `title`, `order`, `status`, `summary`).
- [ ] Buat seeder template bab standar skripsi (Bab 1: Pendahuluan hingga Bab 5: Penutup).

### API Manajemen Riset
- [ ] Buat `ResearchController` (index, store, show, update, destroy).
- [ ] Buat policy `ResearchPolicy` untuk isolasi otorisasi data per user.
- [ ] Implementasi auto-generate 5 bab standar skripsi via model event/observer saat research baru dibuat.
- [ ] Buat endpoint reorder/update status bab: `PATCH /api/researches/{id}/chapters/{chapter_id}`.

### Antarmuka Manajemen Riset
- [ ] Buat halaman katalog riset: daftar penelitian aktif dan tombol tambah penelitian baru.
- [ ] Buat modal/form pembuatan penelitian baru dengan validasi judul dan target kelulusan.
- [ ] Buat mekanisme workspace switcher pada header navigasi untuk berpindah antar judul riset.
- [ ] Buat halaman detail riset beserta navigasi vertikal per bab.

## Milestone 3: Pelacakan Bab & Tugas Mandiri (Task Tracker)
### Manajemen Tugas & Checklist Bab
- [ ] Buat migration tabel `tasks` (kolom: `id`, `chapter_id`, `description`, `is_completed`, `due_date`, `priority`).
- [ ] Buat model `Task` dan relasikan ke `Chapter`.
- [ ] Buat endpoint CRUD tugas: `/api/chapters/{chapter_id}/tasks`.
- [ ] Buat antarmuka to-do list interaktif per bab dengan toggle checklist instan (optimistic UI update).
- [ ] Tambahkan filter status tugas (Semua, Belum Selesai, Selesai) dan label prioritas (Rendah, Sedang, Tinggi).

### Penjadwalan & Deadline
- [ ] Buat endpoint rekap timeline pengerjaan skripsi berdasarkan target deadline bab dan tugas.
- [ ] Integrasikan visualisasi kalender target progres pada frontend.
- [ ] Buat indikator visual jika target bab atau tugas telah melewati batas waktu (overdue warning).

## Milestone 4: Manajemen Dokumen Draf & Log Bimbingan
### Pengarsipan Berkas Draf Skripsi
- [ ] Buat migration tabel `draft_files` (kolom: `id`, `chapter_id`, `file_path`, `file_name`, `version`, `file_size`, `notes`).
- [ ] Konfigurasi disk storage Laravel untuk penyimpanan berkas privat di direktori `storage/app/drafts`.
- [ ] Buat endpoint upload berkas PDF/DOCX: `POST /api/chapters/{id}/drafts` dengan validasi MIME-type dan limit ukuran berkas.
- [ ] Buat endpoint unduh berkas draf: `GET /api/drafts/{id}/download` dengan validasi otorisasi pemilik.
- [ ] Bangun komponen riwayat versi berkas draf per bab di antarmuka frontend.

### Log Bimbingan Mandiri (Catatan Konsultasi)
- [ ] Buat migration tabel `consultation_logs` (kolom: `id`, `research_id`, `consultation_date`, `agenda`, `supervisor_feedback`, `action_items`).
- [ ] Buat Eloquent Model `ConsultationLog` dan relasi ke `Research`.
- [ ] Buat endpoint CRUD log bimbingan: `/api/researches/{id}/consultations`.
- [ ] Buat form input hasil bimbingan: catatan masukan dosen dan aksi revisi mandiri.
- [ ] Bangun antarmuka timeline riwayat konsultasi skripsi.

## Milestone 5: Dashboard Analitik & Ringkasan Progres
### Kalkulasi Metrik & Statistik
- [ ] Buat query agregasi untuk kalkulasi persentase kelulusan bab (rasio tugas tuntas per bab).
- [ ] Buat endpoint ringkasan analitik: `GET /api/researches/{id}/analytics`.
- [ ] Hitung estimasi kesiapan ujian skripsi berdasarkan jumlah bab dengan status "Selesai".

### Antarmuka Dasbor Utama
- [ ] Bangun komponen ringkasan kartu: Persentase Total, Bab Terakhir Dikerjakan, Tugas Tertunda, Tanggal Target Sidang.
- [ ] Integrasikan visual progress bar dinamis untuk kelima bab skripsi.
- [ ] Buat widget aktivitas terbaru (perubahan status tugas, upload draf baru, catatan bimbingan terbaru).

## Milestone 6: Kontainerisasi, Optimasi & Deployment VPS
### Kontainerisasi Docker
- [x] Buat `backend/Dockerfile.prod` untuk Laravel API menggunakan PHP 8.4 FPM alpine base image.
- [ ] Buat multi-stage `Dockerfile` untuk React Vite SPA menggunakan Node.js build stage dan Nginx alpine serving stage.
- [ ] Buat konfigurasi `docker-compose.yml` lokal menghubungkan service: `app` (Laravel), `web` (Nginx), `frontend` (React), dan `db` (MySQL).
- [ ] Buat template file konfigurasi virtual host Nginx untuk reverse proxy API dan SPA routing fallback.

### Deployment VPS
- [ ] Tulis skrip shell otomatisasi deployment: `deploy.sh` (pull repo, build image, run migrations, clear cache).
- [ ] Konfigurasi reverse proxy host Nginx/Traefik pada VPS dengan integrasi sertifikat SSL Let's Encrypt (Certbot).
- [ ] Setup persistent volume Docker untuk direktori data database MySQL dan upload berkas skripsi.
- [ ] Jalankan optimasi Laravel untuk environment produksi (`config:cache`, `route:cache`, `view:cache`).
- [ ] Validasi keamanan: batasi direct access ke database port, nonaktifkan `APP_DEBUG=false`, periksa CORS whitelist origin frontend.