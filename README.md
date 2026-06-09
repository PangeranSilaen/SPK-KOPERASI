# SPK Koperasi (AHP-WP)

Website Sistem Pendukung Keputusan untuk merekomendasikan **strategi penanganan kredit bermasalah** berdasarkan kondisi nasabah. Metode yang digunakan:

- **AHP (Analytical Hierarchy Process)** untuk menentukan bobot kriteria.
- **WP (Weighted Product)** untuk menentukan ranking alternatif strategi.

Sistem **tidak menyimpan data pribadi nasabah**. Yang disimpan hanya model SPK, data pakar, kriteria, alternatif strategi, kondisi nasabah, penilaian AHP/WP, dan hasil perhitungan.

## Tech Stack

- **Next.js (App Router)** + **TypeScript** + `src/` + import alias `@/*`
- **PostgreSQL** + **Prisma ORM**
- **Tailwind CSS** + **shadcn/ui** (gaya Binance dari `DESIGN.md`)
- **Zod** (validasi), **bcryptjs** (hash password), session-based auth berbasis cookie
- **SheetJS `xlsx`** (import), **@react-pdf/renderer** (export PDF)
- **Vitest** (unit test modul perhitungan)

## Fitur Utama

- Login/logout dengan session cookie ber-HMAC.
- Manajemen Model SPK dengan status **Draf / Aktif / Arsip** (versioning).
- Duplikat, publish (dengan validasi kelengkapan + CR), dan arsip model.
- CRUD Expert, Kriteria (benefit/cost), Alternatif Strategi, Kondisi Nasabah.
- Input pairwise AHP per expert (skala Saaty 1-9) + hasil CR live.
- Input nilai strategi WP (skala 1-5) per expert dan kondisi.
- Multi-expert selector + simulasi rekomendasi + detail perhitungan AHP & WP.
- Tie ranking jika selisih nilai V ≤ 0,0005.
- Import XLSX (selalu membuat Model SPK baru) dengan preview & validasi.
- Export hasil rekomendasi ke PDF.
- Seluruh UI Bahasa Indonesia, angka tampil 3 desimal.

## Prasyarat

- Node.js 20+ (diuji pada v22).
- PostgreSQL yang berjalan dan dapat diakses.
- npm.

## Cara Install

```bash
npm install
```

## Setup `.env`

Salin `.env.example` menjadi `.env` lalu isi:

```env
DATABASE_URL="postgresql://postgres:PASSWORD@localhost:5432/spk_koperasi?schema=public"
SESSION_SECRET="<string-acak-panjang>"
```

Buat `SESSION_SECRET` acak, misalnya:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Pastikan database `spk_koperasi` sudah dibuat di PostgreSQL Anda.

## Migrasi & Seed

```bash
npx prisma migrate dev   # menerapkan schema ke database
npx prisma db seed       # mengisi data awal
```

Seed membuat: akun admin, Model SPK Default (Aktif), 1 expert, 6 kriteria, 7 alternatif, dan 5 kondisi. Data AHP/WP belum lengkap (dapat dilengkapi manual atau via import XLSX).

## Menjalankan Aplikasi

```bash
npm run dev      # mode development (http://localhost:3000)
npm run build    # build produksi (verifikasi tipe)
npm run start    # menjalankan hasil build
npm run test     # unit test modul perhitungan (Vitest)
npm run lint     # lint
```

## Akun Login Default

```text
Email: admin@spk.test
Password: admin12345
```

## Cara Import XLSX

1. Buka menu **Import Data**.
2. Unggah file `.xlsx` yang berisi dua sheet:
   - `dummy_ahp_pairwise_long` — perbandingan berpasangan AHP.
   - `Copy of dummy_strategy_long` — nilai strategi WP (kondisi × alternatif × kriteria).
   - Nama sheet boleh berbeda; importer mendeteksi berdasarkan header.
3. Sistem menampilkan preview jumlah data dan hasil validasi.
4. Isi nama Model SPK baru, lalu klik **Buat Model SPK dari Import**.
5. Import selalu membuat Model SPK **baru** berstatus Draf (tidak menimpa model aktif).

## Penjelasan Singkat AHP-WP

**AHP** membentuk matriks perbandingan berpasangan antar kriteria. Jika beberapa expert dilibatkan, nilai pairwise digabung memakai **geometric mean**. Dari matriks dihitung bobot prioritas, λ maks, CI, dan **CR (Consistency Ratio)**. Penilaian dianggap konsisten jika `CR ≤ 0,1` (untuk `n ≤ 2`, CR = 0).

**WP** memakai bobot kriteria hasil AHP. Nilai strategi (skala 1-5) digabung antar expert memakai **rata-rata aritmetika**. Kriteria benefit memakai pangkat positif, cost memakai pangkat negatif:

```text
S_i = ∏ (x_ij ^ p_j)      p_j = +w_j (benefit), -w_j (cost)
V_i = S_i / Σ S
```

Alternatif dengan nilai **V terbesar** adalah rekomendasi terbaik. Dua alternatif dianggap **seri** jika selisih V ≤ 0,0005.

Seluruh perhitungan dilakukan di backend (`src/lib/calculations/`) dengan presisi penuh; pembulatan hanya dilakukan saat tampilan/export (3 desimal).

## Struktur Penting

```text
src/lib/calculations/    # modul AHP, WP, ranking (murni, dites Vitest)
src/lib/import/          # parser & validator XLSX
src/server/services/     # orkestrasi perhitungan, model service, kelengkapan
src/server/actions/      # Server Actions (mutasi data, validasi session)
src/app/(dashboard)/     # halaman aplikasi
prisma/schema.prisma     # schema database
PLAN/                    # dokumen perencanaan (PRD, SRS, Implementation Guide)
docs/superpowers/plans/  # rencana implementasi
```
