# AGENTS.md — SPK Koperasi (AHP-WP)

Dokumen ini adalah panduan kerja untuk semua coding agent (Claude Code, OpenCode, Codex, dll) yang mengerjakan repository **SPK-KOPERASI**. Semua komunikasi dan tulisan agent di repo ini memakai **Bahasa Indonesia**.

## Multi Brain (WAJIB)

- Baca `.multibrain/session.md` terlebih dahulu sebelum mulai bekerja.
- Perlakukan `.multibrain/session.md` hanya sebagai master index.
- Buka hanya file bucket `.multibrain/indexes/*.md` yang relevan dengan tugas saat ini.
- Buka `.multibrain/context/*.md` hanya jika bucket terpilih menunjuk ke konteks lebih dalam yang penting.
- Setelah menyelesaikan pekerjaan berarti, perbarui bucket yang relevan dan segarkan master index bila perlu.

## Tentang Proyek

SPK Koperasi adalah website Sistem Pendukung Keputusan untuk merekomendasikan strategi penanganan kredit bermasalah berdasarkan kondisi nasabah. Metode: **AHP** untuk bobot kriteria dan **WP** untuk perankingan alternatif. Sistem **tidak menyimpan data pribadi nasabah**.

Dokumen perencanaan ada di `PLAN/`:

- `PLAN/01-PRD.md` — kebutuhan produk.
- `PLAN/02-SRS.md` — spesifikasi kebutuhan + rumus AHP/WP + spec import XLSX.
- `PLAN/03-IMPLEMENTATION-GUIDE.md` — instruksi teknis, schema, struktur folder.

Rencana implementasi rinci ada di `docs/superpowers/plans/`.

## Tech Stack

- Next.js (App Router) + TypeScript + `src/` dir + import alias `@/*`.
- PostgreSQL + Prisma ORM.
- Tailwind CSS + shadcn/ui (mengikuti `DESIGN.md` gaya Binance).
- Zod (validasi), bcryptjs (hash password), SheetJS `xlsx` (import/export), `@react-pdf/renderer` atau print-to-PDF.
- Auth: session-based sederhana berbasis cookie.
- **Package manager: npm** (bukan pnpm di environment ini).
- Test: Vitest untuk modul perhitungan.

## Perintah Penting

```bash
npm install
npm run dev            # jalankan dev server
npx prisma migrate dev # migrasi database
npx prisma db seed     # isi data awal
npm run test           # unit test perhitungan (Vitest)
npm run build          # build produksi (verifikasi tipe)
npm run lint           # lint
```

## Konfigurasi Database (dev)

`.env`:

```env
DATABASE_URL="postgresql://postgres:codetohero000@localhost:5432/spk_koperasi?schema=public"
SESSION_SECRET="<random>"
```

## Aturan Wajib (jangan dilanggar)

1. Jangan menyimpan data pribadi nasabah (nama, NIK, telepon, alamat).
2. Semua perhitungan AHP-WP dilakukan di backend/server logic, bukan dari formula spreadsheet.
3. Spreadsheet hanya sumber data mentah; import XLSX selalu membuat Model SPK **baru**.
4. Jangan mengubah Model Aktif secara langsung — duplikat dulu menjadi Draf.
5. Perhitungan internal memakai presisi penuh; tampilan & export memakai **3 desimal** (`formatDecimal`).
6. UI utama wajib Bahasa Indonesia.
7. Pisahkan logic perhitungan dari UI; buat fungsi AHP/WP yang dapat dites.
8. Gunakan shadcn/ui + DESIGN.md; jangan menambah UI library acak.
9. Hanya satu role (Petugas/Admin); jangan buat role kompleks.
10. Validasi session pada semua endpoint mutasi data; validasi input dengan Zod.

## Konvensi Perhitungan (ringkas)

- AHP multi-expert: agregasi pairwise dengan **geometric mean**. CR valid jika `CR <= 0.1`. Jika `n <= 2`, CR = 0.
- WP multi-expert: agregasi nilai strategi dengan **rata-rata aritmetika**. Benefit pangkat positif, cost pangkat negatif. Ranking dari nilai V terbesar. Tie jika selisih V `<= 0.0005`.
- Parsing `pilihan_form`: `Kiri n` → matriks[kiri,kanan] = n; `Kanan n` → = 1/n; `Sama`/`Sama 1` → = 1.

## Akun Default

```text
Email: admin@spk.test
Password: admin12345
```
