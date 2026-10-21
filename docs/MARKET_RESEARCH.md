# Market Research — Trackripsi

> Data mode: **estimate**. Figures without a source are
> internal estimates, not verified data. All monetary figures are IDR (Rupiah).

## Market boundary

- Category: SaaS Produktivitas Riset Akademik Personal
- Geography: Indonesia
- Customer: Mahasiswa tingkat akhir (khususnya rumpun sains, teknik, dan riset kuantitatif/kualitatif intensif)
- Business model: Freemium & Berlangganan per Semester (B2C Student Pricing)
- Timeframe: 2025 - 2028

## Market sizing

| Metric | Value | Range | Method | Source | Confidence |
| --- | --- | --- | --- | --- | --- |
| TAM (top-down) | Rp 240 M | Rp 150 M – Rp 350 M | Estimasi total mahasiswa tingkat akhir aktif di Indonesia (~1,6 juta orang/tahun) dikalikan pengeluaran belanja perangkat lunak produktivitas tahunan maksimal (IDR 150.000/tahun). | model estimate | low |
| TAM (bottom-up) | Rp 225 M | Rp 135 M – Rp 315 M | 1.500.000 mahasiswa sarjana dan diploma akhir per tahun × asumsi ARPU IDR 150.000 per tahun (2 semester × IDR 75.000). | model estimate | low |
| SAM | Rp 67,5 M | Rp 45 M – Rp 90 M | 30% dari populasi mahasiswa akhir (sekitar 450.000 mahasiswa STEM dan ilmu kesehatan yang memiliki beban iterasi draf/jurnal tinggi serta memiliki laptop pribadi) × ARPU IDR 150.000/tahun. | model estimate | low |
| SOM (3y) | Rp 1,8 M | Rp 900 jt – Rp 3 M | Target adopsi 2,6% dari target SAM dalam 3 tahun (~12.000 pengguna berbayar per tahun) mengandalkan kanal akuisisi organik kampus dan komunitas mahasiswa. | model estimate | low |

TAM berada di kisaran IDR 150-350 Miliar per tahun. Ukuran pasar terbatas oleh daya beli mahasiswa dan masa retensi alami yang sangat singkat (hanya aktif saat masa tugas akhir).

## Competitors

| Name | Positioning | Pricing | Strengths | Gaps |
| --- | --- | --- | --- | --- |
| Google Drive / Google Docs | Penyimpanan awan umum dan dokumen kolaboratif bawaan | Gratis (kuota 15 GB); Google One mulai IDR 26.900/bulan | Terintegrasi penuh, tanpa biaya tambahan, sinkronisasi otomatis, sudah menjadi standar de facto mahasiswa. | File berserakan tanpa struktur bab skripsi bawaan, penomoran versi membingungkan, tidak ada matriks sintesis literatur otomatis. |
| Notion (Template Skripsi Komunitas) | Workspace all-in-one fleksibel berbasis blok dan database | Gratis untuk personal (Plus plan gratis via email kampus .ac.id) | Kustomisasi matriks jurnal sangat tinggi, tampilan visual menarik, banyak template gratis beredar di media sosial. | Curva belajar tinggi, sinkronisasi file binary besar (PDF/DOCX) terbatas, rawan rusak jika pengguna salah ubah formula database. |
| Mendeley / Zotero | Manajer referensi dan pembaca PDF sitasi ilmiah | Gratis (Zotero: open source; Mendeley: freemium storage Elsevier) | Integrasi sitasi langsung ke Microsoft Word/LibreOffice, ekstraksi metadata PDF otomatis. | Tidak mengelola log catatan bimbingan dosen, tidak menangani progres draft bab non-sitasi, tidak ada kanban/tahapan skripsi. |

## Demand signals

- **Tingginya penjualan template Notion dan spreadsheet skripsi di marketplace lokal (Shopee, KaryaKarsa, TikTok Shop)** — Penjualan template bertema 'Skripsi Tracker' mencapai ribuan unit transaksi per listing independen pada rentang harga IDR 15.000 - IDR 49.000. _(model estimate)_
- **Keluhan rutin 'file draft revisi tertukar' di platform media sosial mahasiswa (X/Twitter dan TikTok)** — Volume percakapan berulang seputar file 'Revisi_Final_v2_Acc.docx' hilang atau tertimpa saat musim sidang semester genap dan ganjil. _(model estimate)_
- **Pemanfaatan micro-tools untuk manajemen literatur oleh mahasiswa** — Tingginya interaksi postingan tutorial matriks literatur jurnal di TikTok dan X dengan puluhan ribu bookmark. _(model estimate)_

## Monetisation

Models: Freemium (Penyimpanan 500 MB, 1 proyek riset aktif), Subscription Semesteran (IDR 75.000/semester), Subscription Tahunan (IDR 130.000/tahun)

| Tier | Price | Notes |
| --- | --- | --- |
| Gratis | IDR 0 | Penyimpanan 500 MB, 1 riset, matriks jurnal maksimal 25 entri, pelacakan riwayat bimbingan standar. |
| Pejuang Skripsi (Per Semester) | IDR 75.000 / 6 bulan | Penyimpanan 15 GB, riset multi-proyek, riwayat versi tanpa batas, ekspor rekap log bimbingan ke PDF. |
| Riset Intensif (Tahunan) | IDR 130.000 / tahun | Penyimpanan 30 GB, pencarian teks lengkap dalam PDF jurnal, backup otomatis ke Google Drive pribadi. |

Unit economics — CAC: IDR 20.000 - IDR 40.000 · LTV: IDR 75.000 - IDR 130.000 · Payback: 2 - 4 bulan

- Assumption: Retensi pelanggan maksimal 1-2 semester (6-12 bulan) karena mahasiswa langsung churn setelah lulus sidang.
- Assumption: Akuisisi bertumpu pada konten organik TikTok, afiliasi micro-influencer edukasi kampus, dan poster digital BEM fakultas.
- Assumption: Biaya penyimpanan S3/Wasabi dan egress bandwidth berkisar IDR 3.000 - IDR 5.000 per pengguna aktif berbayar per bulan.

## Risks

| Risk | Severity | Mitigation |
| --- | --- | --- |
| Lifecycle Churn Ekstrem — Pengguna memiliki batas masa pakai bawaan. Setelah skripsi selesai dan wisuda, pengguna 100% berhenti berlangganan, memaksa akuisisi pengguna baru konstan setiap semester. | high | Buka fitur transisi pasca-lulus: konversi draf menjadi arsip portofolio publik atau CV riset untuk melamar kerja/S2. |
| Inersia Alat Gratis (Google Ecosystem) — Mahasiswa terbiasa menggunakan Google Drive dan WhatsApp secara gratis meskipun berantakan, menekan kesediaan membayar (willingness-to-pay). | high | Sediakan fitur integrasi 1-klik yang mengimpor/mengekspor langsung ke Google Drive sehingga pengguna tidak merasa meninggalkan ekosistem lama. |
| Biaya Infrastruktur Penyimpanan dan Bandwidth — Pengunggahan banyak draf skripsi berukuran besar beserta lampiran data mentah/PDF jurnal dapat menggerus margin kotor langganan murah. | medium | Terapkan kompresi PDF sisi klien (client-side) sebelum upload, integrasikan S3 compatible storage hemat biaya, dan terapkan batasan ukuran per file. |

## Scorecard

| Dimension | Score /10 | Weight | Rationale |
| --- | --- | --- | --- |
| Problem severity | 6 | 0.125 | Masalah nyata dan memicu stres mahasiswa, namun mahasiswa sudah punya solusi tambal sulam (Google Drive + folder bertingkat). |
| Market size | 4.5 | 0.125 | Terbatas hanya pada mahasiswa skripsi Indonesia dengan daya beli rendah dan masa pakai per pengguna sangat pendek. |
| Competition | 5 | 0.125 | Kompetitor tidak langsung (Google Drive, Notion, Zotero) berstatus dominan, stabil, dan sebagian besar gratis. |
| Differentiation | 6 | 0.125 | Spesifik menyelesaikan alur kerja draf + log bimbingan, tetapi mudah ditiru oleh template Notion terstruktur. |
| Monetisation | 4 | 0.125 | Nilai transaksi semesteran kecil, churn rate struktural mendekati 100% per tahun pasca-kelulusan. |
| Distribution | 7 | 0.125 | Sangat mudah dipasarkan secara viral via TikTok/X dan jejaring komunitas mahasiswa tingkat akhir. |
| Timing | 6.5 | 0.125 | Literasi digital mahasiswa matang, terbiasa memakai web app modern untuk kebutuhan kuliah. |
| Feasibility | 8.5 | 0.125 | Kompleksitas teknis rendah: arsitektur standar autentikasi, database relasional untuk log/matriks, dan S3 storage. |

**Weighted score: 5.9/10**

## Verdict

**PIVOT** (confidence: medium)

Model bisnis B2C SaaS murni untuk 'mahasiswa skripsi saja' memiliki cacat struktural pada churn rate (pengguna pasti pergi setelah 1-2 semester) serta daya beli yang minim. Proyek layak dibangun hanya jika diperluas (pivot) menjadi ruang kerja repositori riset mahasiswa umum (bisa dipakai sejak semester awal untuk makalah/tugas besar hingga skripsi), atau dijual sebagai produk sekali bayar (one-time license / template tool) untuk menekan overhead operasional server berkelanjutan.

Top risks:

- Tingkat churn tahunan mendekati 100% karena pengguna wisuda.
- Ketergantungan pada Google Drive gratis terlalu kuat di kalangan mahasiswa.
- Margin tipis akibat biaya cloud storage dan payment gateway lokal.

Next validation steps:

- [ ] Rilis landing page sederhana uji minat dengan formulir tunggu (waitlist) dan tombol pre-order IDR 50.000.
- [ ] Uji purwarupa tanpa penyimpanan file (hanya tracker versi lokal dan matriks jurnal web) untuk validasi retensi.
- [ ] Eksplorasi perluasan target ke peneliti pemula dan mahasiswa pascasarjana untuk meningkatkan siklus hidup pengguna (LTV).

## Assumptions & limitations

- Jumlah mahasiswa tingkat akhir di Indonesia stabil di kisaran 1,5 - 1,6 juta orang per tahun.
- Biaya akuisisi pelanggan (CAC) dapat ditekan di bawah IDR 35.000 melalui pemasaran konten organik tanpa iklan berbayar mahal.
- Pengguna bersedia membayar langganan per semester di kisaran IDR 75.000 asalkan onboarding jauh lebih cepat dibanding membuat database Notion sendiri.
- Rata-rata penyimpanan yang digunakan pengguna berbayar tidak melebihi 10 GB selama masa pengerjaan skripsi.

## Sources

1. [TAM, SAM & SOM Examples: How to Calculate Your Real Market Size - PulseAI Research](https://pulseairesearch.com/pulse-shift/blogs/599/tam_sam_som_examples_how_to_calculate_your_real_market_size)
2. [Academic Research and Development Market Report 2026](https://www.researchandmarkets.com/reports/5931069/academic-research-development-market-report)
3. [Market Sizing: Meet SAM and TAM](https://www.bu.edu/researchsupport/files/2022/04/Market-sizing_Meet-SAM-and-TAM.pdf)

---
_Generated by ideomile.com. This is analysis, not investment or legal advice._