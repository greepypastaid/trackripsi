# Product Requirements Document — Trackripsi.app

## 1. Executive summary

Trackripsi.app adalah aplikasi web *self-management* skripsi untuk mahasiswa tingkat akhir. Sistem memfasilitasi pelacakan alur penyusunan tugas akhir secara mandiri tanpa birokrasi kampus. Sistem tidak melibatkan akses dosen, penguji, atau staf akademik. Fokus utama aplikasi: pelacakan bab/milestone, pencatatan log bimbingan pribadi, pengorganisasian berkas draf, dan pemantauan target waktu penyelesaian. Sistem mendukung satu pengguna mengelola banyak riset sekaligus (*multi-research*).

## 2. Goals & success metrics

### Goals
- Menyediakan sistem pelacakan progres skripsi terstruktur dari Bab 1 hingga sidang/yudisium.
- Memusatkan riwayat revisi dan catatan mandiri pasca-bimbingan dalam satu tempat.
- Mencegah keterlambatan target skripsi melalui visualisasi linimasa personal.

### Success metrics
- **Task completion rate:** > 80% tugas/target bab diselesaikan sebelum *due date* yang ditentukan pengguna.
- **Log consistency:** Pengguna mencatat minimal 1 log bimbingan setiap 2 minggu selama fase riset aktif.
- **System performance:** Waktu respons API backend p95 < 150ms; Vite SPA First Contentful Paint (FCP) < 1.0 detik.

## 3. Personas & user stories

### Persona
- **Nama:** Mahasiswa Akhir (Andi)
- **Peran:** Pengguna tunggal / pemilik proyek riset.
- **Karakteristik:** Menjalani skripsi utama dan proyek publikasi sampingan, sering lupa instruksi lisan dosen pembimbing, butuh pemantauan jadwal mandiri tanpa intervensi pihak luar.

### User stories
- **US-01:** Sebagai mahasiswa, saya ingin membuat akun dengan email dan kata sandi agar data riset tersimpan privat.
- **US-02:** Sebagai mahasiswa, saya ingin membuat lebih dari satu proyek riset agar dapat melacak skripsi utama dan karya ilmiah lainnya secara paralel.
- **US-03:** Sebagai mahasiswa, saya ingin mencatat target per bab beserta tenggat waktu agar dapat memecah beban tugas akhir.
- **US-04:** Sebagai mahasiswa, saya ingin mencatat hasil bimbingan dan poin tindakan perbaikan (*action items*) setelah bertemu dosen.
- **US-05:** Sebagai mahasiswa, saya ingin mengunggah dan memberi versi pada draf berkas (PDF/DOCX) agar riwayat file revisi tidak berantakan.
- **US-06:** Sebagai mahasiswa, saya ingin melihat ringkasan visual persentase progres dan linimasa penyelesaian agar termotivasi menyelesaikan target.

## 4. Scope: in / out

### In scope
- Otentikasi mandiri berbasis token (`email` + `password`).
- Manajemen multi-riset per akun pengguna (CRUD riset).
- Pelacak hierarki target skripsi: Riset -> Bab / Fase -> Sub-tugas (*checklist*).
- Buku log bimbingan mandiri: tanggal, nama pembimbing, rangkuman masukan, dan to-do list revisi.
- Manajemen versi berkas draf lokal per bab (PDF, DOCX; limit 15MB per berkas (maks. 5 draf per bab)).
- Dasbor metrik: persentase progres keseluruhan, hitung mundur tenggat (*deadline countdown*), kalender/linimasa aktivitas.

### Out of scope
- Portal/login dosen, penguji, koordinator skripsi, atau tata usaha.
- Alur *approval* / persetujuan dokumen resmi berbasis tanda tangan digital.
- Integrasi Single Sign-On (SSO) kampus, LDAP, Google OAuth, atau SIAKAD.
- Komentar/anotasi langsung (*in-line annotation*) di dalam berkas PDF/DOCX.
- Notifikasi pihak ketiga via WhatsApp Gateway, SMS, atau Push Notification eksternal.

## 5. Functional requirements

### 5.1 Otentikasi & Akun
- **FR-01: Registrasi & Login**
  - Deskripsi: Pengguna dapat mendaftar dan masuk menggunakan kombinasi email dan password.
  - Acceptance criteria:
    1. Validasi input: email valid dan unik; panjang kata sandi minimal 8 karakter.
    2. Respons login mengembalikan token otentikasi via Laravel Sanctum.
    3. Proteksi *rate limiting* pada endpoint login (maksimal 5 percobaan gagal per menit).

### 5.2 Manajemen Riset
- **FR-02: Multi-Research CRUD**
  - Deskripsi: Pengguna dapat mengelola banyak proyek riset secara terpisah.
  - Acceptance criteria:
    1. Pengguna dapat membuat proyek baru dengan atribut: `title`, `faculty_field`, `supervisor_name`, `target_completion_date`.
    2. Proyek riset terisolasi penuh per `user_id`; pengguna A dilarang mengakses data pengguna B (HTTP 403/404).
    3. Proyek riset dapat diarsipkan (*archive*) atau dihapus permanen (*soft delete* opsional).

### 5.3 Pelacakan Bab & Tugas (Milestone Tracker)
- **FR-03: Template dan Kustomisasi Bab**
  - Deskripsi: Pengguna dapat memantau progres bab dengan templat default atau struktur kustom.
  - Acceptance criteria:
    1. Saat riset dibuat, sistem otomatis menyediakan templat default Bab 1 s.d. Bab 5.
    2. Pengguna dapat menambah, mengedit urutan (`order`), mengganti nama, atau menghapus bab.
    3. Setiap bab memiliki status: `not_started`, `in_progress`, `revision`, `completed`.
- **FR-04: Sub-Tugas Checklist**
  - Deskripsi: Pengguna dapat memecah pengerjaan bab ke dalam sub-tugas kecil.
  - Acceptance criteria:
    1. Tiap bab dapat memuat banyak entri checklist dengan field `title`, `due_date`, dan `is_completed`.
    2. Perubahan status sub-tugas memperbarui persentase kalkulasi progres bab secara otomatis.

### 5.4 Log Bimbingan Mandiri
- **FR-05: Pencatatan Konsultasi**
  - Deskripsi: Pengguna mencatat detail sesi bimbingan yang telah dilakukan secara mandiri.
  - Acceptance criteria:
    1. Form log mencakup: `meeting_date`, `chapter_id` (opsional), `feedback_notes`, dan daftar `action_items`.
    2. `action_items` dapat dikonversi menjadi sub-tugas checklist bab secara instan.
    3. Data log dapat diurutkan berdasarkan kronologi waktu terbalik.

### 5.5 Repositori Berkas Draf
- **FR-06: Manajemen Berkas & Versi Draf**
  - Deskripsi: Pengguna dapat mengunggah dan mengunduh berkas draf pengerjaan.
  - Acceptance criteria:
    1. Sistem membatasi tipe berkas hanya MIME type: `application/pdf`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`.
    2. Ukuran maksimal berkas: 15 MB per upload.
    3. Sistem mencatat versi inkremental (`v1.0`, `v1.1`, dst.) per bab secara otomatis atau manual.
    4. Pengunduhan berkas dilindungi middleware otentikasi; tidak dapat diakses publik via *direct static URL*.

### 5.6 Dasbor & Pelaporan
- **FR-07: Dasbor Metrik Progres**
  - Deskripsi: Tampilan ringkas metrik kemajuan skripsi.
  - Acceptance criteria:
    1. Menampilkan kalkulasi agregat: persentase progres total berbasis bobot bab/tugas.
    2. Menampilkan peringatan visual jika melewati target tanggal (*overdue badge*).
    3. Menyediakan tombol ekspor riwayat log bimbingan ke format file cetak PDF/HTML sederhana untuk kebutuhan laporan fisik mahasiswa.

## 6. Non-functional requirements

### Performance
- Waktu eksekusi kueri Eloquent untuk dasbor riset < 50ms (manfaatkan *eager loading* relasi).
- Aset frontend React via Vite di-build dengan kompresi Gzip/Brotli; ukuran *initial bundle* < 250 KB.
- Pengunggahan file menggunakan *streaming response* standar disk lokal Laravel Storage.

### Security
- Otentikasi Stateless API Token menggunakan Laravel Sanctum.
- Sanitasi input dan proteksi terhadap SQL Injection melalui PDO Prepared Statements milik Eloquent.
- Penyimpanan kata sandi wajib hashing `bcrypt` atau `argon2id`.
- Validasi ketat *Content-Type* berkas pada sisi backend, bukan hanya validasi ekstensi frontend.
- Kebijakan CORS dibatasi hanya ke domain/origin frontend React SPA.

### Privacy
- Isolasi data penuh tingkat basis data via relasi kepemilikan `user_id`.
- Tidak ada data yang dibagikan antar-pengguna; tidak ada fitur profil publik.

### Reliability
- Lingkungan produksi berjalan di atas Docker Compose (layanan terpisah: `app-php`, `web-nginx`, `db-mariadb`).
- Kontainer memiliki konfigurasi `restart: unless-stopped`.
- Mekanisme database transactional (`DB::transaction`) untuk operasi mutasi multi-tabel (contoh: hapus riset beserta seluruh bab dan berkas).

### Accessibility
- Antarmuka Tailwind CSS v4 wajib mematuhi standar WCAG 2.1 Level AA pada kontras warna teks dan elemen interaktif.
- Navigasi komponen modal, dropdown, dan form harus dapat dioperasikan penuh menggunakan keyboard (Focus management, Escape listener).
- Seluruh elemen form memiliki label eksplisit untuk pembaca layar (*screen reader*).

## 7. Data & integrations

### Skema Basis Data (Relasional)

```text
users
  - id: BIGINT UNSIGNED (PK)
  - name: VARCHAR(255)
  - email: VARCHAR(255) (UNIQUE)
  - password: VARCHAR(255)
  - created_at: TIMESTAMP
  - updated_at: TIMESTAMP

researches
  - id: BIGINT UNSIGNED (PK)
  - user_id: BIGINT UNSIGNED (FK -> users.id, ON DELETE CASCADE)
  - title: VARCHAR(500)
  - faculty_field: VARCHAR(255) NULL
  - supervisor_name: VARCHAR(255) NULL
  - target_completion_date: DATE NULL
  - status: ENUM('active', 'completed', 'archived') DEFAULT 'active'
  - created_at: TIMESTAMP
  - updated_at: TIMESTAMP

chapters
  - id: BIGINT UNSIGNED (PK)
  - research_id: BIGINT UNSIGNED (FK -> researches.id, ON DELETE CASCADE)
  - title: VARCHAR(255)
  - order: INT UNSIGNED DEFAULT 1
  - status: ENUM('not_started', 'in_progress', 'revision', 'completed') DEFAULT 'not_started'
  - created_at: TIMESTAMP
  - updated_at: TIMESTAMP

tasks
  - id: BIGINT UNSIGNED (PK)
  - chapter_id: BIGINT UNSIGNED (FK -> chapters.id, ON DELETE CASCADE)
  - title: VARCHAR(255)
  - due_date: DATE NULL
  - is_completed: BOOLEAN DEFAULT FALSE
  - created_at: TIMESTAMP
  - updated_at: TIMESTAMP

supervision_logs
  - id: BIGINT UNSIGNED (PK)
  - research_id: BIGINT UNSIGNED (FK -> researches.id, ON DELETE CASCADE)
  - chapter_id: BIGINT UNSIGNED NULL (FK -> chapters.id, ON DELETE SET NULL)
  - meeting_date: DATE
  - feedback_notes: TEXT
  - created_at: TIMESTAMP
  - updated_at: TIMESTAMP

action_items
  - id: BIGINT UNSIGNED (PK)
  - supervision_log_id: BIGINT UNSIGNED (FK -> supervision_logs.id, ON DELETE CASCADE)
  - description: VARCHAR(255)
  - is_resolved: BOOLEAN DEFAULT FALSE
  - created_at: TIMESTAMP
  - updated_at: TIMESTAMP

document_drafts
  - id: BIGINT UNSIGNED (PK)
  - chapter_id: BIGINT UNSIGNED (FK -> chapters.id, ON DELETE CASCADE)
  - version_label: VARCHAR(50)
  - file_path: VARCHAR(500)
  - file_name: VARCHAR(255)
  - mime_type: VARCHAR(100)
  - file_size_bytes: BIGINT UNSIGNED
  - created_at: TIMESTAMP
  - updated_at: TIMESTAMP
```

### Integrasi Sistem
- **Internal API:** Frontend React 19 mengonsumsi RESTful JSON API yang diekspos oleh Laravel.
- **Penyimpanan Berkas:** Menggunakan *local disk storage* tervolume pada Docker host (`storage/app/private`).
- **Integrasi Pihak Ketiga:** Ditiadakan.

## 8. Risks & open questions

### Risks
| Risiko | Dampak | Strategi Mitigasi |
| :--- | :--- | :--- |
| **Kapasitas disk VPS habis karena upload dokumen berulang** | Tinggi | Batasi ukuran file max 15MB. Sediakan fitur penghapusan draf lama dan batasi maksimal 5 draf per bab. |
| **Penyalahgunaan penyimpanan file (eksekusi berkas berbahaya)** | Kritis | Larang penyimpanan file di folder publik `public/`. Sajikan file via rute streaming terproteksi (`Storage::download()`) dengan validasi MIME backend ketat. |
| **Kehilangan data riset akibat kegagalan kontainer VPS** | Kritis | Gunakan persistent Docker named volumes untuk MariaDB dan direktori berkas. Jadwalkan cron backup reguler ke off-site storage. |

### Open questions
- **Ekspor Lembar Bimbingan:** Apakah perlu disediakan templat PDF siap cetak khusus yang meniru format tanda tangan logbook lembar bimbingan fisik universitas umum?
  - *Asumsi saat ini:* Sistem hanya menyediakan ekspor tabel generik tanggal-catatan ke PDF/HTML. Pengguna mencetak data tabular murni.
- **Pola Penomoran Versi Berkas:** Apakah penomoran versi draf dokumen dikunci otomatis oleh sistem (v1, v2, v3) atau bebas dinamai secara fleksibel oleh mahasiswa (contoh: "Draf Revisi Pasca Sempro")?
  - *Asumsi saat ini:* Sistem otomatis menyarankan format `v{increment}`, namun tetap memberikan opsi *custom note* pada tiap entri unggahan.