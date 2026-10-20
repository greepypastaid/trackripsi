# Design Specification — Skripsi Manager

## 1. Information architecture

Peta struktur navigasi aplikasi:

```text
/
├── (auth)
│   ├── /login                          # Form login email & password
│   └── /register                       # Form registrasi pengguna baru
│
├── /dashboard                          # Ringkasan multi-riset & progress agregat
│
└── /researches/:researchId             # Ruang kerja spesifik per riset/skripsi
    ├── /overview                       # Ringkasan bab, target timeline, checklist utama
    ├── /chapters                       # Tracker progres Bab 1 - Bab N
    │   └── /:chapterId                 # Detail bab: draft berkas, to-do list, catatan mandiri
    ├── /guidance-logs                  # Log mandiri hasil bimbingan (poin revisi & status selesai)
    ├── /references                     # Pengelola daftar pustaka, link, file referensi
    ├── /documents                      # Riwayat versi berkas naskah lengkap (PDF/DOCX)
    └── /settings                       # Pengaturan judul, target tanggal kelulusan, arsip riset
```

---

## 2. Core user flows

### Flow 1: Pendaftaran & Inisiasi Riset Baru
```text
[Daftar Akun] -> [Dashboard Kosong] -> [Tombol: Buat Riset Baru]
  -> [Modal Form: Judul, Bidang Studi, Target Selesai]
  -> [Sistem Generate Template Standar Bab 1-5]
  -> [Arahkan ke /researches/:id/overview]
```

### Flow 2: Pembaruan Progres & Task Bab
```text
[/researches/:id/chapters] -> [Pilih Bab] -> [Ubah Status: Not Started / Draft / Revision / Done]
  -> [Tambah Checklist Todo / Unggah Draf Baru]
  -> [Metrik Progres Bab & Keseluruhan Otomatis Terkalkulasi]
```

### Flow 3: Pencatatan Catatan Bimbingan (Self-Log)
```text
[/researches/:id/guidance-logs] -> [Tombol: Catat Bimbingan]
  -> [Form: Tanggal, Topik Bahasan, Poin Revisi Dosen, Target Selesai Revisi]
  -> [Simpan] -> [Daftar Todo Otomatis Muncul di Dashboard Riset]
```

### Flow 4: Manajemen Referensi Skripsi
```text
[/researches/:id/references] -> [Tombol: Tambah Referensi]
  -> [Form: Judul, Penulis, Tahun, Status Baca, URL/Berkas, Bab Terkait]
  -> [Simpan] -> [Filter berdasar Status: Belum Dibaca / Dibaca / Disitasi]
```

---

## 3. Design tokens

Implementasi styling menggunakan Tailwind CSS v4 via CSS custom variables.

### 3.1 Color Palette

| Token | CSS Variable / Tailwind Class | Hex Value | Penggunaan |
| :--- | :--- | :--- | :--- |
| `primary-50` | `bg-primary-50` | `#EEF2FF` | Highlight baris, badge background |
| `primary-500` | `bg-primary-500` | `#6366F1` | Brand color, link hover |
| `primary-600` | `bg-primary-600` | `#4F46E5` | Tombol primer, tab aktif |
| `primary-700` | `bg-primary-700` | `#4338CA` | Hover tombol primer |
| `surface-bg` | `bg-slate-50` | `#F8FAFC` | Latar belakang aplikasi |
| `surface-card` | `bg-white` | `#FFFFFF` | Latar kartu konten & modal |
| `border-subtle`| `border-slate-200` | `#E2E8F0` | Garis pemisah tabel, kartu |
| `border-strong`| `border-slate-300` | `#CBD5E1` | Border input form |
| `text-main` | `text-slate-900` | `#0F172A` | Judul, heading, teks penting |
| `text-muted` | `text-slate-600` | `#475569` | Body text, label |
| `text-faint` | `text-slate-400` | `#94A3B8` | Placeholder, tanggal sekunder |
| `success-600` | `bg-emerald-600` | `#059669` | Status Selesai / Terverifikasi |
| `warning-600` | `bg-amber-600` | `#D97706` | Status Dalam Revisi / Menunggu |
| `danger-600` | `bg-rose-600` | `#E11D48` | Status Tertunda / Tombol Hapus |

### 3.2 Typography

*   **Font Family**: `font-sans` (`Inter, system-ui, -apple-system, sans-serif`)
*   **Mono Family**: `font-mono` (`JetBrains Mono, monospace`) untuk kode, hash file, nomor bab.

| Role | Font Size | Line Height | Weight | Tailwind Utility |
| :--- | :--- | :--- | :--- | :--- |
| Heading 1 | 24px (1.5rem) | 32px (2rem) | Bold (700) | `text-2xl font-bold tracking-tight` |
| Heading 2 | 20px (1.25rem) | 28px (1.75rem) | Semibold (600) | `text-xl font-semibold` |
| Heading 3 | 16px (1.0rem) | 24px (1.5rem) | Medium (500) | `text-base font-medium` |
| Body Text | 14px (0.875rem)| 20px (1.25rem) | Normal (400) | `text-sm font-normal` |
| Caption/Meta| 12px (0.75rem) | 16px (1.0rem) | Medium (500) | `text-xs font-medium` |

### 3.3 Spacing

Baseline 4px.

| Token | Nilai | Penggunaan |
| :--- | :--- | :--- |
| `space-1` | 4px (`0.25rem`) | Gap ikon kecil, margin internal badge |
| `space-2` | 8px (`0.5rem`) | Padding input teks kecil, gap daftar kompak |
| `space-3` | 12px (`0.75rem`)| Padding vertikal button, gap form group |
| `space-4` | 16px (`1.0rem`) | Padding standar kartu konten |
| `space-6` | 24px (`1.5rem`) | Jarak antar kartu panel, padding modal |
| `space-8` | 32px (`2.0rem`) | Margin antar section halaman |

### 3.4 Radius & Elevation

*   **Radius**:
    *   `rounded-md` (`6px`): Input field, select dropdown, button standar.
    *   `rounded-lg` (`8px`): Kartu konten, list panel.
    *   `rounded-xl` (`12px`): Modal dialog, notification toast.
    *   `rounded-full`: Avatar, badge indikator status.
*   **Elevation**:
    *   `shadow-xs`: Kartu statis default (`0 1px 2px 0 rgb(0 0 0 / 0.05)`).
    *   `shadow-md`: Dropdown menu, popover (`0 4px 6px -1px rgb(0 0 0 / 0.1)`).
    *   `shadow-xl`: Modal tengah (`0 20px 25px -5px rgb(0 0 0 / 0.1)`).

---

## 4. Components

### 4.1 ResearchSwitcher
Komponen navigasi atas untuk berpindah konteks riset atau membuat riset baru.

*   **Default**: Menampilkan judul riset aktif + chevron icon.
*   **Open**: Menampilkan daftar riset yang tersedia, persentase progres ringkas, dan opsi "*+ Tambah Riset Baru*".
*   **Empty**: Teks "*Belum ada riset*", fokus ke trigger inisiasi.

### 4.2 ChapterCard
Kartu ringkasan status bab di halaman `/chapters`.

*   **Props**: `chapterNumber`, `title`, `status`, `todoCount`, `doneCount`, `updatedAt`.
*   **States**:
    *   *Default*: Kartu border abu-abu netral, progress bar mini.
    *   *Hover*: Border berubah `border-primary-500`, shadow naik ke `shadow-sm`.
    *   *Active/Selected*: Border `border-primary-600` dengan outline `ring-2 ring-primary-100`.
    *   *Disabled/Locked*: Opasitas 50%, interaksi klik mati (untuk bab opsional/terkunci).

### 4.3 GuidanceLogItem
Komponen daftar linier untuk riwayat bimbingan pada `/guidance-logs`.

*   **Struktur**: Tanggal (kolom kiri), catatan pembahasan (tengah), checklist poin revisi (kanan).
*   **States**:
    *   *Pending Review*: Tag amber `bg-amber-50 text-amber-700`.
    *   *Resolved*: Tag emerald `bg-emerald-50 text-emerald-700`, teks strike-through jika checkbox dicentang.
    *   *Action trigger*: Ikon edit & hapus muncul saat kursor mendekati baris (hover row).

### 4.4 StatusBadge

```html
<!-- Draft -->
<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">Draft</span>

<!-- In Revision -->
<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">Revisi</span>

<!-- Done -->
<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">Selesai</span>
```

### 4.5 DocumentUploader
Dropzone berkas naskah PDF/DOCX.

*   **Default**: Area putus-putus (`border-dashed border-slate-300`), ikon upload, label format file.
*   **Dragover**: Background `bg-primary-50`, border `border-primary-500`.
*   **Uploading**: Indikator persentase transfer file dan tombol batal.
*   **Error**: Pesan teks merah (`text-rose-600`), border `border-rose-400` jika ukuran > 20MB atau ekstensi tidak valid.

---

## 5. Accessibility

Target kepatuhan: **WCAG 2.2 Level AA**.

### 5.1 Kontras dan Teks
*   Rasio kontras teks normal minimal 4.5:1 terhadap latar belakang (e.g., `#0F172A` di `#FFFFFF` = 15.3:1).
*   Komponen non-teks (border form, ikon indikator) memiliki rasio kontras minimal 3:1 terhadap elemen sekitarnya.
*   Tidak menggunakan warna tunggal sebagai indikator status; selalu sandingkan ikon status atau teks deskriptif bersama warna badge.

### 5.2 Perilaku Keyboard
*   **Urutan Tab Logis**: Mengikuti struktur DOM dari kiri ke kanan, atas ke bawah.
*   **Focus Visible**: Indikator fokus konsisten menggunakan ring native: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2`.
*   **Modal & Dialog Trap**: Fokus terperangkap di dalam modal saat terbuka. Tombol `Escape` langsung menutup modal aktif dan mengembalikan fokus ke trigger awal.
*   **Checklist Todo**: Tombol `Space` mengubah status checkbox; panah `Up`/`Down` berpindah item todo dalam list.

### 5.3 Atribut ARIA & Struktur Semantik
*   Gunakan elemen HTML semantik murni: `<main>`, `<nav>`, `<aside>`, `<section>`, `<header>`.
*   Pembaruan dinamis (seperti metrik persentase progres kalkulasi otomatis) diinjeksi via `aria-live="polite"`.
*   Input formulir selalu terikat secara eksplisit ke elemen `<label>` via `htmlFor`/`id`.

---

## 6. Motion & micro-interactions

Animasi difokuskan pada kepastian respons sistem tanpa latensi yang menghambat alur kerja input cepat.

### 6.1 Transition Tokens
*   **Durasi Cepat**: `150ms` (interaksi tombol, checklist check, switch toggle).
*   **Durasi Sedang**: `200ms` (dropdown menu, popover, alert dismiss).
*   **Durasi Lambat**: `300ms` (slide-over panel detail bab, modal transition).
*   **Easing**: `cubic-bezier(0, 0, 0.2, 1)` (ease-out bawaan Tailwind).

### 6.2 Micro-Interactions Spesifik
*   **Centang Todo Item**:
    *   Durasi: 150ms.
    *   Aksi: Cekboks mengisi warna `emerald-600`, teks tugas bertransisi ke opasitas 50% dengan animasi strike-through.
*   **Update Progress Bar**:
    *   Durasi: 250ms ease-out.
    *   Aksi: Lebar bar progres bertambah secara mulus (`transition-all duration-300 ease-out`).
*   **Penyimpanan Otomatis (Autosave Form Input)**:
    *   Ikon status kecil di pojok field: teks "*Menyimpan...*" memudar (fade in 150ms) lalu berganti menjadi ikon centang abu-abu "*Tersimpan*" sebelum menghilang dalam 2 detik.
*   **Prefers-Reduced-Motion**:
    *   Saat preferensi sistem OS aktif: matikan semua transformasi skala dan translasi koordinat (`@media (prefers-reduced-motion: reduce)`). Transisi terbatas hanya pada perubahan `opacity`.