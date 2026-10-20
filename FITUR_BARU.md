# Fitur Baru — Arah Pengembangan Trackripsi.app

Dokumen ini menjawab satu pertanyaan: **fitur apa lagi yang bikin sistem ini benar-benar dipakai mahasiswa setiap minggu, bukan cuma saat onboarding?**

Prinsip pemilihan: sistem ini *all-in-one place* pencatatan skripsi. Jadi fitur dipilih hanya jika (a) menyelesaikan stresor nyata yang terdokumentasi di riset, (b) bisa dikerjakan penuh di dalam sistem tanpa integrasi pihak ketiga yang rapuh, dan (c) tidak menduplikasi tool yang sudah unggul dan gratis.

---

## 1. Dasar riset (bukan asumsi)

### 1.1 Stresor dominan mahasiswa skripsi (Indonesia)

Studi deskriptif pada 80 mahasiswa tingkat akhir (Susmiatin dkk., *Jurnal Ilmiah Kesehatan Mandira Cendikia* Vol. 4 No. 1, 2025) menemukan faktor pemicu stres pada kriteria berat:

| Faktor | Porsi |
| :--- | :--- |
| Support system | 86% |
| Role of supervisor (proses bimbingan) | 84% |
| Data analysis method | 80% |
| Research gap | 69% |
| Literatur review | 66% |

### 1.2 Penyebab keterlambatan / hambatan penyelesaian

- **UNM Makassar** (Azrizal 2020; Pasaribu dkk. 2016): faktor dominan adalah kemampuan menulis, kesibukan, dan **proses bimbingan dengan dosen**. Mahasiswa "kurang melaksanakan bimbingan terhadap dosen pembimbing".
- **STKIP Melawi** (2024): faktor internal ±70% — kemampuan menulis kurang, motivasi lemah, bingung, malas, kesulitan referensi.
- **UNPAM** (Lubis dkk., 2022): hambatan komunikasi — **dosen sulit ditemui**, mahasiswa takut/segan menghubungi pembimbing, dan **kurang teliti menangkap pesan lisan** dari pembimbing.
- **PGSD UWKS** (2019): hambatan psikis kognitif 67,39%, minim bimbingan.
- Prokrastinasi akademik: 50–70% mahasiswa menunda tugas (Rozental & Carlbring 2014; Mohammadi Bytamar 2017; Zacks 2018).

**Terjemahan ke produk**: yang paling menentukan kelulusan bukan sekadar progres bab, tapi **kualitas & frekuensi bimbingan** + **kemampuan mensintesis literatur**. Keduanya saat ini belum ada di sistem.

### 1.3 Standar administratif kampus

- Banyak panduan skripsi mewajibkan **berita acara bimbingan minimal 12 kali**, ditandatangani pembimbing (contoh: Pedoman Skripsi STMIK Triguna Dharma 2024/2025; Pedoman Skripsi UPI).
- Umumnya 2 dosen pembimbing dengan pembagian peran: isi/konseptual vs penulisan/tata bahasa.
- Sidang: pertanyaan penguji mayoritas bersifat pemahaman dan klarifikasi (analisis 5 kategori pada *LITERA* Vol. 17 No. 2, 2018), dan pertanyaan berulang tiap tahun (alasan topik, kebaruan, alasan metode, sampling, teori).

### 1.4 Benchmark kompetitor

| Tool | Fitur yang jadi standar global | Yang kurang relevan untuk konteks Indonesia |
| :--- | :--- | :--- |
| Thesis Prime | Supervision Logs, Synthesis Matrix, Readiness Tracker, risk detection | Logbook formal kampus, bahasa Indonesia |
| myThesio / LitMaps | Literature discovery, PRISMA-ready workflow, export RIS/BibTeX | Berbayar / butuh akun, tidak mencatat progres bab |
| Zotero / Mendeley | Sitasi di Word, CSL 10.000+ gaya | Tidak mencatat log bimbingan, tidak tahu progres skripsi |
| ResearchRabbit / Connected Papers | Citation map visual | Gratis dan sudah sangat bagus → **jangan ditiru** |

Kesimpulan: celah yang bisa diisi secara unik = **logbook bimbingan formal + matriks literatur berbahasa Indonesia + kesiapan sidang**, bukan pencarian literatur visual.

### 1.5 Sumber data eksternal gratis

- `https://api.openalex.org/works/doi:10.1234/abcd` — metadata lengkap (judul, penulis, tahun, jurnal, DOI, abstrak), CC0, tanpa API key, 10 req/s. Parameter `mailto=` untuk polite pool.
- `https://api.crossref.org/works/{doi}` — fallback jika DOI tidak ada di OpenAlex.
- Tidak ada key, tidak ada penyimpanan kredensial pihak ketiga → sesuai *Golden rules* AGENTS.md.

---

## 2. Peta fitur & prioritas

| # | Fitur | Prioritas | Alasan utama (riset) | Effort |
| :--- | :--- | :--- | :--- | :--- |
| F1 | Matriks Literatur + auto-fetch metadata DOI | P0 | Research gap 69%, literatur review 66% | M |
| F2 | Generator sitasi & daftar pustaka | P0 | Kebutuhan tiap bab; Zotero tidak menyimpan catatan progres | S |
| F3 | Jadwal & agenda bimbingan | P0 | Supervisor 84%, dosen sulit ditemui, lupa instruksi lisan | S |
| F4 | Pemeriksaan kesiapan sidang | P1 | Standar kampus (min. 12 bimbingan, kelengkapan berkas) | S |
| F5 | Cetak lembar logbook bimbingan | P1 | Kewajiban administratif 12x bimbingan + tanda tangan | S |
| F6 | Bank pertanyaan sidang + jawaban sendiri | P2 | Pertanyaan penguji berulang & dapat diprediksi | S |
| F7 | PRISMA flow sederhana dari status literatur | P2 | Standar metodologi; murah karena reuse F1 | S |

Fitur yang **sengaja tidak dibuat** (lihat §7): AI writer, citation map visual, viewer PDF, backup cloud, integrasi WhatsApp/Google kalender.

---

## 3. F1 — Matriks Literatur + auto-fetch metadata

### Tujuan
Satu tempat mengumpulkan jurnal, menilai kelayakan, lalu **mengisi Bab 2** dari data yang sudah distrukturkan. Ini fitur yang membuat sistem dipakai *malam-malam saat menulis*, bukan cuma saat check-list.

### Skema data

**`literature_entries`** (per riset, bukan per bab)

| Kolom | Tipe | Keterangan |
| :--- | :--- | :--- |
| `id` | bigint PK | |
| `research_id` | FK `researches` cascade | isolasi data |
| `title` | string(500) | |
| `authors` | json | `[{"family":"Susmiatin","given":"Eko A."}]` agar sitasi bisa render |
| `year` | smallint nullable | |
| `container` | string nullable | nama jurnal/penerbit |
| `volume` / `issue` / `pages` | string nullable | |
| `doi` | string nullable, unique per research | |
| `url` | text nullable | |
| `abstract` | text nullable | dari OpenAlex (inverted index → direkonstruksi) |
| `type` | enum `journal|book|thesis|web|other` | memengaruhi format sitasi |
| `status` | enum `candidate|included|excluded` default `candidate` | dasar PRISMA (F7) |
| `exclusion_reason` | string nullable | wajib diisi jika `excluded` |
| `notes` | text nullable | ringkasan pribadi |
| `metadata_source` | enum `manual|openalex|crossref` | transparansi asal data |
| `created_at` / `updated_at` | | |

**`synthesis_fields`** — kolom sintesis yang bisa dikustom per riset (contoh: Metode, Variabel, Temuan, Limitasi, Gap)

| Kolom | Tipe |
| :--- | :--- |
| `id` | bigint PK |
| `research_id` | FK cascade |
| `label` | string(100) |
| `order` | unsigned int |
| unique | `(research_id, label)` |

**`literature_entry_values`** (pivot nilai per sel matriks)

| Kolom | Tipe |
| :--- | :--- |
| `id` | bigint PK |
| `literature_entry_id` | FK cascade |
| `synthesis_field_id` | FK cascade |
| `value` | text |
| unique | `(literature_entry_id, synthesis_field_id)` |

Seed default saat riset dibuat: `Metode`, `Variabel/Fokus`, `Temuan`, `Limitasi`, `Gap` (bisa diubah pengguna). Kolom default inilah yang jadi sumber kalimat Bab 2.

### Endpoint

| Method | Path | Fungsi |
| :--- | :--- | :--- |
| `GET/POST` | `/researches/{research}/literature` | daftar (filter `status`, `q`) & tambah manual |
| `PATCH/DELETE` | `/literature/{entry}` | ubah status/field; hapus |
| `POST` | `/researches/{research}/literature/import-doi` | body `{ doi }` → fetch OpenAlex → Crossref fallback → simpan |
| `GET/POST` | `/researches/{research}/synthesis-fields` | kelola kolom matriks |
| `PATCH/DELETE` | `/synthesis-fields/{field}` | |
| `PUT` | `/literature/{entry}/values` | body `{ values: [{ synthesis_field_id, value }] }` (bulk upsert) |

### Implementasi minimal (rung 2–4 ladder)

- Service `App\Services\LiteratureMetadata` dengan satu method `fetchByDoi(string $doi): ?array`:
  - `Http::timeout(8)->get('https://api.openalex.org/works/doi:'.$doi, ['mailto' => config('services.openalex.mailto')])`
  - fallback `https://api.crossref.org/works/'.$doi`
  - normalisasi ke struktur kolom di atas; `metadata_source` mencatat asal.
- Rekonstruksi abstrak OpenAlex (format `abstract_inverted_index`) dalam satu helper statis + satu unit test.
- Tidak menambah dependency: pakai `Http` facade (bawaan Laravel) dan `config/services.php`.
- Tidak ada crawling/scheduler. Fetch hanya saat user menekan "Import DOI".

### UI

- Halaman `/researches/:researchId/literature`.
- Tab status: `Semua / Kandidat / Termasuk / Dikecualikan`.
- Tabel matriks (kolom sintesis bisa digeser/diubah), sel editable inline.
- Form tambah: input DOI + tombol "Ambil metadata"; preview sebelum simpan; mode manual jika tidak ada DOI.
- Tombol aksi per baris: ubah status (dengan alasan eksklusi wajib), salin sitasi, buka DOI.

### Acceptance criteria

1. Import DOI valid mengisi minimal title, authors, year, container dalam < 3 detik.
2. DOI duplikat pada riset sama mengembalikan 422 dengan pesan Indonesia.
3. DOI tidak ditemukan di kedua sumber → 422, tidak menyimpan data parsial.
4. User B mendapat 403 saat mengakses entry milik user A.
5. Sel matriks dan status bisa diubah tanpa reload halaman.

---

## 4. F2 — Generator sitasi & daftar pustaka

### Tujuan
Satu klik menghasilkan sitasi siap tempel untuk satu jurnal, dan daftar pustaka Bab 2 dalam format kampus. Nilai tinggi, biaya rendah karena datanya sudah ada di F1.

### Gaya sitasi (per riset)
`citation_style` pada `researches`: `apa7 | ieee | harvard | chicago_author_date`. Default `apa7`.

### Endpoint

| Method | Path | Fungsi |
| :--- | :--- | :--- |
| `GET` | `/researches/{research}/literature/{entry}/citation?style=` | sitasi in-text + referensi |
| `GET` | `/researches/{research}/literature/bibliography` | daftar pustaka semua entry `included` (html + text) |
| `GET` | `/researches/{research}/literature/export?format=bibtex` | ekspor `.bib` |

### Implementasi minimal
- `App\Support\CitationFormatter` dengan satu method `format(array $entry, string $style)`. Pure function, tanpa dependency.
- Lapisan yang wajib benar (dan yang diuji): urutan penulis, `et al.` vs `dkk.`, italic pada container via `<em>`, separator halaman `–`, penulisan DOI sebagai URL.
- Daftar pustaka diurutkan alfabetis (APA) atau sesuai urutan sitasi (IEEE — v1 cukup alfabetis, beri catatan `ponytail:` di kode).

### Acceptance criteria
1. Sitasi APA 7 untuk artikel dengan 3 penulis menghasilkan format `Penulis, A. B., Penulis, C., & Penulis, D. (2024).` (maks. 20 penulis).
2. Entry berstatus `excluded` tidak muncul di daftar pustaka.
3. Tombol "Salin" menyalin teks polos ke clipboard dengan notifikasi toast.
4. Export BibTeX bisa diimpor ke Zotero tanpa error.

> Catatan jujur: generator ini ***bukan*** pengganti Zotero untuk dokumen Word. Ia menyelesaikan 80% kebutuhan mahasiswa S1 yang menempel manual, dan hanya untuk sumber di sistem.

---

## 5. F3 — Jadwal & agenda bimbingan

### Tujuan
Membalik log bimbingan dari reaktif → proaktif. Menutup celah terbesar (84% role of supervisor + "dosen sulit ditemui" + lupa instruksi lisan).

### Skema data

**`supervision_appointments`**

| Kolom | Tipe | Keterangan |
| :--- | :--- | :--- |
| `id` | bigint PK | |
| `research_id` | FK cascade | |
| `scheduled_at` | datetime | jadwal pertemuan |
| `agenda` | json `[string]` | poin yang mau dibawa |
| `log_id` | FK `supervision_logs` nullable, nullOnDelete | diisi saat selesai |
| `status` | enum `planned|done|cancelled` | |
| `timestamps` | | |

> Kesederhanaan sengaja: agenda disimpan sebagai JSON, bukan tabel sendiri. Ini daftar pendek maks. ~10 baris per pertemuan; relasi tabel tidak memberi nilai tambah. `ponytail:` pindah ke tabel bila butuh status per poin.

### Endpoint

| Method | Path | Fungsi |
| :--- | :--- | :--- |
| `GET/POST` | `/researches/{research}/appointments` | jadwal mendatang + riwayat |
| `PATCH/DELETE` | `/appointments/{appointment}` | ubah jadwal/agenda, batalkan |
| `POST` | `/appointments/{appointment}/complete` | body log bimbingan → buat `supervision_logs`, set `log_id`, `status=done` |

### Perilaku yang bikin berguna
- **Saran agenda otomatis** (satu query, tanpa AI): poin revisi belum terselesaikan dari log terakhir + tugas `is_completed=false` dengan `due_date` terlampaui + bab berstatus `revision`.
- **Banner dashboard**: "Bimbingan 3 hari lagi — 4 agenda siap dibawa".
- Selesai bimbingan → langsung jadi log + poin revisi seperti alur FR-05 yang sudah ada.

### Acceptance criteria
1. Membuat jadwal menampilkan banner di dashboard `/dashboard`.
2. `complete` membuat tepat satu `supervision_logs` dan menandai appointment `done`.
3. Agenda hasil saran otomatis dapat diedit sebelum disimpan.
4. Tidak ada akses lintas user (403).

---

## 6. F4–F7 — Fitur pengaman sebelum sidang

### F4 — Pemeriksaan kesiapan sidang
Bundle checklist pada riset (kolom `readiness_items` atau cukup konfigurasi JSON `readiness_config` + kalkulasi runtime — **pilih kalkulasi runtime**, tidak ada tabel baru):

| Item | Sumber data |
| :--- | :--- |
| Semua bab `completed` | `chapters.status` |
| Minimal N sesi bimbingan | `count(supervision_logs)` (N default 12) |
| Setiap bab punya minimal satu draf | `document_drafts` |
| Tidak ada poin revisi terbuka | `action_items.is_resolved` |
| Daftar pustaka minimal X entri `included` | `literature_entries` |
| Satuan waktu tersisa vs target sidang | `target_completion_date` |
| Checklist manual kampus (TOEFL, bebas plagiasi, dll.) | input pengguna |

Endpoint: `GET /researches/{research}/readiness` → `{ score, blockers: [...] }`. UI: kartu di Overview.

### F5 — Cetak lembar logbook bimbingan
Halaman `/researches/:id/logbook/print` dengan `@media print` CSS (tanpa library PDF baru): kop riset, tabel tanggal–bab–masukan–tindak lanjut, kolom tanda tangan pembimbing 1 & 2, penomoran urut. Memenuhi kewajiban administratif yang diminta hampir semua pedoman skripsi.

### F6 — Bank pertanyaan sidang
Tabel `defense_questions` seeded (bukan tabel per user): bab terkait, kategori (`motivasi|kebaruan|metode|sampling|teori|hasil`), teks pertanyaan. Tabel `defense_answers` (user): `research_id`, `defense_question_id`, `answer` text, `is_ready` bool. UI: daftar per bab + indicator "belum ada jawaban".

### F7 — PRISMA flow sederhana
Halaman turunan F1: hitungan `identified` (semua entri), `screened` (status diubah apa pun), `included`, `excluded` + alasan terbanyak. Render sebagai blok bertumpuk CSS + tombol cetak. Tanpa library diagram.

---

## 7. Yang sengaja TIDAK dibuat

| Ditolak | Alasan |
| :--- | :--- |
| AI writing / AI parafrase | Bukan kebutuhan pencatatan; risiko integritas akademik; butuh biaya API berulang |
| Citation map visual (mirip ResearchRabbit) | ResearchRabbit & Connected Papers gratis dan jauh lebih matang |
| Viewer PDF + highlight | Mendeley/Zotero sudah unggul; biaya storage & rendering tinggi |
| Backup otomatis Google Drive | Menambah OAuth + kuota; bertentangan dengan "tanpa integrasi pihak ketiga" |
| Notifikasi WhatsApp/email push | Di luar scope PRD; bisa ditambah via `artisan schedule` nanti jika ada feedback |
| Tabel terpisah untuk agenda/checklist kecil | JSON cukup; hindari boilerplate |

---

## 8. Urutan eksekusi

| Tahap | Isi | Dependency | Estimasi |
| :--- | :--- | :--- | :--- |
| 1 | Migrasi `literature_entries`, `synthesis_fields`, `literature_entry_values` + Model + Policy | — | 0.5 hari |
| 2 | `LiteratureMetadata` service + import DOI + unit test rekonstruksi abstrak | 1 | 0.5 hari |
| 3 | Controller + FormRequest + Resource + feature test (termasuk 403 lintas user) | 1–2 | 0.5 hari |
| 4 | `CitationFormatter` + endpoint sitasi/bibliography/bibtex + unit test | 3 | 0.5 hari |
| 5 | Halaman Frontend `/literature` (tabel matriks + form DOI) | 3 | 1 hari |
| 6 | `supervision_appointments` + agenda saran otomatis + banner dashboard | — | 0.5 hari |
| 7 | Endpoint & UI `readiness` | 5,6 | 0.5 hari |
| 8 | Halaman cetak logbook | 6 | 0.5 hari |
| 9 | Bank pertanyaan sidang + jawaban | — | 0.5 hari |
| 10 | PRISMA flow (reuse F1) | 5 | 0.25 hari |

Total ±5 hari kerja untuk F1–F5; sisanya opsional.

Aturan tetap yang berlaku di semua tahap:
- Semua akses anak entitas lewat `$request->user()->researches()->findOrFail($id)` atau policy, bukan `findOrFail` polos (cegah IDOR).
- Validasi mutasi via FormRequest.
- Minimal satu feature test per controller.
- Lint: `npm run lint` dan `./vendor/bin/pint`.
- Variabel env baru (`OPENALEX_MAILTO`) wajib masuk `backend/.env.example`.

---

## 9. Metrik untuk menilai apakah fitur ini berguna

| Metrik | Target | Cara ukur |
| :--- | :--- | :--- |
| Sesi bimbingan per riset aktif | ≥ 8 dalam 4 bulan | `count(supervision_logs)` |
| Entri literatur per riset | ≥ 15 dengan status `included` | query bulanan |
| Rasio agenda otomatis dipakai | ≥ 50% appointment punya agenda | query appointment |
| Waktu ke daftar pustaka pertama | < 10 menit sejak daftar akun | manual spot-check, 5 pengguna |
| Fitur yang tidak dipakai | teruskan, buang | action item mingguan |

---

## 10. Sumber

1. Susmiatin, E. A., Ishariani, L., & Kartikasari, M. (2025). Analisis Faktor-Faktor Penyebab Stres Selama Mengerjakan Skripsi. *Jurnal Ilmiah Kesehatan Mandira Cendikia*, 4(1), 50–57. DOI: 10.70570/jikmc.v4i1.1568
2. Anonim. (2023). Analisis Penghambat Penyelesaian Skripsi Mahasiswa Pendidikan Teknik Mesin UNM. https://eprints.unm.ac.id/31586/
3. Lubis, M., Rahmanita, F., & Ulfa, M. (2022). Komunikasi Dosen Pembimbing Terhadap Kualitas Skripsi Mahasiswa. *Eduka* 7(2).
4. Analy, S. (2019). Analisis Faktor Penghambat Skripsi Mahasiswa PGSD UWKS. *JPD: Jurnal Pendidikan Dasar*.
5. Anonim. (2024). Analisis Keterlambatan Penyelesaian Studi Mahasiswa PGSD STKIP Melawi. https://jurnalstkipmelawi.ac.id/
6. Prokrastinasi Akademik di Kalangan Mahasiswa. *Coution: Journal of Counseling and Education* 4(2), 2023.
7. Analisis Kategori Pertanyaan pada Ujian Tugas Akhir Skripsi. *LITERA* 17(2), 2018. https://journal.uny.ac.id/index.php/litera/
8. Pedoman Skripsi STMIK Triguna Dharma 2024/2025 — kewajiban berita acara bimbingan minimal 12 kali.
9. Pedoman Skripsi UPI — struktur sidang dan berkas kelengkapan.
10. OpenAlex API Reference. https://help.openalex.org/api (CC0, tanpa key, 10 req/s).
11. Crossref REST API. https://www.crossref.org/documentation/retrieve-metadata/rest-api
12. Zotero Citation Styles (CSL). https://www.zotero.org/support/styles
