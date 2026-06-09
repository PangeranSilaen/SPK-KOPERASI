# SPK Koperasi AHP-WP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun website SPK Koperasi berbahasa Indonesia yang merekomendasikan strategi penanganan kredit bermasalah memakai metode AHP (bobot kriteria) + WP (ranking alternatif), dengan versioning Model SPK, multi-expert selector, import XLSX, dan export PDF.

**Architecture:** Next.js App Router (TypeScript, `src/`) sebagai fullstack. Logic perhitungan murni di `src/lib/calculations/` (dapat dites Vitest, presisi penuh). Mutasi data lewat Server Actions yang divalidasi session cookie + Zod. PostgreSQL via Prisma. UI shadcn/ui bergaya Binance (DESIGN.md) Bahasa Indonesia.

**Tech Stack:** Next.js (App Router) + TypeScript, PostgreSQL + Prisma, Tailwind + shadcn/ui, Zod, bcryptjs, SheetJS `xlsx`, `@react-pdf/renderer`, Vitest. Package manager **npm**.

**Database (dev):** `DATABASE_URL="postgresql://postgres:codetohero000@localhost:5432/spk_koperasi?schema=public"`

---

## Catatan Konvensi (berlaku untuk semua task)

- Semua teks UI Bahasa Indonesia.
- Perhitungan internal presisi penuh; display & export pakai `formatDecimal` (3 desimal).
- Tidak menyimpan data pribadi nasabah.
- Import XLSX selalu membuat Model SPK baru berstatus DRAFT.
- Model ACTIVE tidak boleh diedit langsung; harus diduplikasi jadi DRAFT.
- Commit kecil & sering. Pesan commit Bahasa Indonesia (`feat:`, `fix:`, `chore:`, `test:`).

---

## File Structure

```text
src/
├── app/
│   ├── (auth)/login/page.tsx          # halaman login
│   ├── (dashboard)/
│   │   ├── layout.tsx                  # shell sidebar + topbar
│   │   ├── dashboard/page.tsx
│   │   ├── model-spk/page.tsx          # list model
│   │   ├── model-spk/[modelId]/page.tsx        # detail + kelengkapan
│   │   ├── model-spk/[modelId]/expert/page.tsx
│   │   ├── model-spk/[modelId]/kriteria/page.tsx
│   │   ├── model-spk/[modelId]/alternatif/page.tsx
│   │   ├── model-spk/[modelId]/kondisi/page.tsx
│   │   ├── model-spk/[modelId]/ahp/page.tsx
│   │   ├── model-spk/[modelId]/nilai-strategi/page.tsx
│   │   ├── model-spk/[modelId]/simulasi/page.tsx
│   │   ├── model-spk/[modelId]/hasil/page.tsx
│   │   └── import-data/page.tsx
│   ├── api/import/preview/route.ts     # upload + preview (multipart)
│   ├── api/export/pdf/route.ts         # stream PDF
│   ├── layout.tsx                      # root layout (dark, font)
│   └── globals.css
├── components/
│   ├── ui/                             # shadcn
│   ├── layout/{sidebar,topbar}.tsx
│   ├── calculation/{ahp-detail,wp-detail,ranking-table}.tsx
│   └── forms/*                         # form CRUD
├── lib/
│   ├── prisma.ts                       # singleton PrismaClient
│   ├── auth.ts                         # session cookie helpers
│   ├── format.ts                       # formatDecimal
│   ├── ri-table.ts                     # tabel Random Index
│   ├── calculations/{ahp,wp,ranking}.ts
│   ├── completeness.ts                 # helper kelengkapan data
│   ├── validations/*.ts                # schema Zod
│   └── import/{xlsx-parser,import-validator,import-service}.ts
└── server/
    ├── actions/*.ts                    # Server Actions (mutasi)
    └── services/model-service.ts       # duplikat/publish/arsip
prisma/
├── schema.prisma
└── seed.ts
src/lib/calculations/__tests__/*.test.ts
```

---

## Phase 0 — Setup Proyek

### Task 0.1: Scaffold Next.js + dependencies

**Files:** seluruh root `SPK-KOPERASI/`

- [ ] Jalankan `npx create-next-app@latest . --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --no-turbopack` (jawab default; jangan timpa `AGENTS.md`, `.agents/`, `.multibrain/`, `docs/`, `PLAN/`).
- [ ] `npm i @prisma/client zod bcryptjs xlsx lucide-react @react-pdf/renderer` lalu `npm i -D prisma tsx vitest @types/bcryptjs`.
- [ ] Copy `PLAN/` ke dalam repo (sudah berada di parent; salin folder ke `./PLAN`).
- [ ] Tambah skrip `package.json`: `"test": "vitest run"`, `"prisma": {"seed": "tsx prisma/seed.ts"}`.
- [ ] Verifikasi: `npm run build` sukses (app default). Commit `chore: inisialisasi project SPK Koperasi`.

### Task 0.2: shadcn/ui + DESIGN.md Binance

- [ ] `npx getdesign@latest add binance` (hasilkan `DESIGN.md`). Jika gagal/offline, buat `DESIGN.md` manual berisi token Binance (lihat catatan eksekusi) dan lanjut.
- [ ] `npx shadcn@latest init` (base color slate/neutral, CSS variables true).
- [ ] `npx shadcn@latest add button card input label table tabs badge dialog dropdown-menu select textarea separator alert form checkbox sidebar progress sonner`.
- [ ] Set dark theme + aksen Binance yellow (`#FCD535`) di `globals.css` / token CSS.
- [ ] Verifikasi `npm run build`. Commit `chore: setup shadcn/ui + DESIGN.md Binance`.

### Task 0.3: Prisma + env + koneksi DB

**Files:** Create `.env`, `.env.example`, `src/lib/prisma.ts`, `prisma/schema.prisma`

- [ ] `npx prisma init`. Isi `.env`: `DATABASE_URL="postgresql://postgres:codetohero000@localhost:5432/spk_koperasi?schema=public"` dan `SESSION_SECRET` random.
- [ ] Buat `.env.example` tanpa nilai rahasia. Pastikan `.env` ada di `.gitignore`.
- [ ] Buat `src/lib/prisma.ts` (singleton PrismaClient dengan global cache untuk dev).
- [ ] Commit `chore: setup prisma + koneksi database`.

---

## Phase 1 — Database Schema + Seed

### Task 1.1: Prisma schema

**Files:** `prisma/schema.prisma`

- [ ] Salin schema dari `PLAN/03-IMPLEMENTATION-GUIDE.md` §7 persis (enum `ModelStatus`, `CriterionType`, `PairwisePreference`; model `User`, `DecisionModel`, `Expert`, `Criterion`, `Alternative`, `Condition`, `AhpComparison`, `StrategyScore`, `CalculationRun`). Pertahankan semua `@@unique`/`@@index`.
- [ ] `npx prisma migrate dev --name init` lalu `npx prisma generate`.
- [ ] Verifikasi tabel dibuat (`npx prisma migrate status`). Commit `feat: schema database Model SPK + AHP + WP`.

### Task 1.2: Seed data default

**Files:** `prisma/seed.ts`

- [ ] Buat seed: user admin (`admin@spk.test` / hash bcrypt `admin12345`), satu `DecisionModel` "Model SPK Default" status `ACTIVE` `isDefault=true`, expert default (Bapak Ahmad Suryanto / Manajer Kredit Koperasi Pusaka 78 / 12 tahun), 6 kriteria (PRD §7.1), 7 alternatif (§7.2), 5 kondisi (§7.3). Gunakan `upsert` agar idempotent.
- [ ] Seed boleh tanpa data AHP/WP (model dianggap "Belum lengkap").
- [ ] `npx prisma db seed`. Verifikasi via `npx prisma studio` atau query count.
- [ ] Commit `feat: seed admin + Model SPK default`.

---

## Phase 2 — Modul Perhitungan (TDD lebih dulu)

> Logic murni, tanpa DB. Tulis test dulu, jalankan gagal, implementasi, jalankan lulus, commit. Semua di `src/lib/calculations/`.

### Task 2.1: `format.ts` + `ri-table.ts`

**Files:** Create `src/lib/format.ts`, `src/lib/ri-table.ts`, `src/lib/calculations/__tests__/format.test.ts`

- [ ] **Test gagal:** `formatDecimal(0.3666)` → `"0.367"`, `formatDecimal(12.3)` → `"12.300"`, `formatDecimal(1.2449)` → `"1.245"`.
- [ ] Run `npx vitest run src/lib/calculations/__tests__/format.test.ts` → FAIL.
- [ ] Implementasi `formatDecimal(v:number)=> v.toFixed(3)`. `ri-table.ts` ekspor `RI: Record<number,number>` sesuai SRS §5.5 (n=1..15) + helper `getRI(n)` (return 0 untuk n<=2).
- [ ] Run test → PASS. Commit `feat: helper format desimal + tabel RI`.

### Task 2.2: `ahp.ts`

**Files:** Create `src/lib/calculations/ahp.ts`, `src/lib/calculations/__tests__/ahp.test.ts`

- [ ] **Test gagal** mencakup: matriks reciprocal (`a_ji = 1/a_ij`, diagonal 1); `aggregatePairwiseByGeometricMean` 2 expert (mis. [3,5] → sqrt(15)); satu expert → nilai itu sendiri; bobot AHP jumlah ≈ 1 (toleransi 1e-9); CR = 0 saat n<=2; matriks konsisten 3x3 → CR ≈ 0; tipe output sesuai signature di guide §10.1.
- [ ] Run vitest → FAIL.
- [ ] Implementasi fungsi: `aggregatePairwiseByGeometricMean`, `buildPairwiseMatrix`, `calculateAhp` (kolom sum, normalisasi, bobot=rata baris, Aw=A·w, cv=Aw/w, lambdaMax=rata cv, CI=(λ-n)/(n-1), CR=CI/RI, isConsistent=cr<=0.1). Tanpa rounding internal.
- [ ] Run test → PASS. Commit `feat: modul perhitungan AHP + test`.

### Task 2.3: `wp.ts` + `ranking.ts`

**Files:** Create `src/lib/calculations/wp.ts`, `src/lib/calculations/ranking.ts`, `__tests__/wp.test.ts`

- [ ] **Test gagal:** `aggregateStrategyScoresByAverage` 2 expert (mis. [4,2]→3); exponent benefit positif = weight, cost negatif = -weight; `S_i = ∏ x_ij^p_j`; `V_i = S_i/ΣS` jumlah V ≈ 1; ranking urut V desc; tie jika |ΔV| <= 0.0005 (dua alternatif rank sama, alternatif berikut rank+gap sesuai spec §6.5).
- [ ] Run vitest → FAIL.
- [ ] Implementasi `calculateWp` + `assignRankings` (tie handling: alternatif dengan selisih <= 0.0005 dari yang sebelumnya dapat rank sama; rank berikutnya = index urutan + 1).
- [ ] Run test → PASS. Commit `feat: modul perhitungan WP + ranking + test`.

### Task 2.4: `completeness.ts`

**Files:** Create `src/lib/completeness.ts`, `__tests__/completeness.test.ts`

- [ ] **Test gagal:** `getRequiredAhpPairCount(6)` → 15, `(7)` → 21; `getRequiredStrategyScoreCount(5,7,6)` → 210.
- [ ] Implementasi 2 fungsi murni (sinkron). (Fungsi async `getExpertCompleteness`/`getModelCompleteness` berbasis DB dibuat di Phase 5.)
- [ ] Run test → PASS. Commit `feat: helper kelengkapan data + test`.

---

## Phase 3 — Auth + Layout

### Task 3.1: Session auth helpers + Zod login

**Files:** Create `src/lib/auth.ts`, `src/lib/validations/auth.ts`

- [ ] `auth.ts`: `createSession(userId)` set cookie httpOnly `spk_session` berisi token ter-sign HMAC (SESSION_SECRET) + userId; `getSession()` baca & verifikasi cookie → return user (via prisma) atau null; `destroySession()`; `requireSession()` redirect `/login` jika null. Pakai `next/headers` cookies.
- [ ] `validations/auth.ts`: `loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) })`.
- [ ] Commit `feat: session auth + validasi login`.

### Task 3.2: Login page + action

**Files:** Create `src/app/(auth)/login/page.tsx`, `src/server/actions/auth.ts`

- [ ] `auth.ts` action `loginAction(formData)`: validasi Zod, cari user by email, `bcrypt.compare`. Gagal → return error "Email atau password tidak sesuai." Sukses → createSession + redirect `/dashboard`. `logoutAction`: destroySession + redirect `/login`.
- [ ] Login page: card form email/password, tombol "Masuk", alert error. Gaya Binance dark.
- [ ] Verifikasi manual: login admin sukses, kredensial salah tampil error ID. Commit `feat: halaman login + logout`.

### Task 3.3: Dashboard layout (sidebar + topbar)

**Files:** Create `src/app/(dashboard)/layout.tsx`, `src/components/layout/sidebar.tsx`, `topbar.tsx`

- [ ] Layout `requireSession()` di server. Sidebar link: Dashboard, Model SPK, Import Data. Topbar: nama user + tombol Logout (form action `logoutAction`).
- [ ] Semua label Bahasa Indonesia. Verifikasi route dashboard ter-protect (akses tanpa login → redirect login). Commit `feat: layout dashboard + proteksi route`.

### Task 3.4: Dashboard page

**Files:** Create `src/app/(dashboard)/dashboard/page.tsx`

- [ ] Server component: ambil model ACTIVE + count kriteria/alternatif/kondisi/expert + status kelengkapan. Tampilkan cards + tombol cepat (Buat Model, Import XLSX, Lihat Hasil). Empty state jika belum ada model aktif.
- [ ] Commit `feat: halaman dashboard ringkasan`.

---

## Phase 4 — Model SPK + CRUD entitas

### Task 4.1: Validasi Zod entitas + model service

**Files:** Create `src/lib/validations/{model,expert,criterion,alternative,condition}.ts`, `src/server/services/model-service.ts`

- [ ] Schema: model (nama wajib, deskripsi opsional); expert (nama, jabatan?, pengalaman?, catatan?, isEnabled); criterion (kode, nama, type enum BENEFIT/COST, order, isActive); alternative & condition (kode, nama, deskripsi?, order, isActive).
- [ ] `model-service.ts`: `duplicateModel(modelId)` (copy expert/kriteria/alternatif/kondisi/ahp/strategy ke model baru DRAFT, nama `Salinan dari {nama}`, map id lama→baru), `publishModel(modelId)` (validasi publish §15, set ACTIVE, model ACTIVE lama → ARCHIVED), `archiveModel(modelId)`, `assertEditable(model)` (throw jika ACTIVE).
- [ ] Commit `feat: validasi entitas + service model SPK`.

### Task 4.2: Model SPK actions + list/detail page

**Files:** Create `src/server/actions/model.ts`, `src/app/(dashboard)/model-spk/page.tsx`, `model-spk/[modelId]/page.tsx`

- [ ] Actions (semua `requireSession`): `createModelAction`, `duplicateModelAction`, `publishModelAction`, `archiveModelAction`. Pakai `revalidatePath`.
- [ ] List page: tabel model (nama, status badge, jumlah data, tombol Lihat/Duplikat/Publish). Tombol "Buat Model SPK" (dialog form).
- [ ] Detail page: ringkasan + progress kelengkapan AHP/WP per expert + tab navigasi ke sub-halaman. Jika ACTIVE, tombol edit diarahkan ke "Duplikat menjadi Draf".
- [ ] Commit `feat: manajemen Model SPK (list, detail, duplikat, publish, arsip)`.

### Task 4.3: CRUD Expert

**Files:** Create `src/app/(dashboard)/model-spk/[modelId]/expert/page.tsx`, action `upsertExpertAction`, `deleteExpertAction` di `src/server/actions/entities.ts`

- [ ] Tabel expert + dialog form upsert. Badge status kelengkapan (Lengkap/Belum lengkap) AHP & WP. Nonaktifkan tanpa hapus historis. Blokir mutasi jika model ACTIVE (assertEditable).
- [ ] Commit `feat: CRUD expert`.

### Task 4.4: CRUD Kriteria / Alternatif / Kondisi

**Files:** `src/app/(dashboard)/model-spk/[modelId]/{kriteria,alternatif,kondisi}/page.tsx`, actions di `entities.ts`

- [ ] Kriteria: kode unik per model, nama, jenis benefit/cost, urutan, aktif. Saat tambah → tandai AHP/WP perlu dilengkapi (info banner). Alternatif & Kondisi serupa (tanpa jenis).
- [ ] Validasi unik kode per model (tangani error Prisma P2002 → pesan ID). Blokir jika model ACTIVE.
- [ ] Commit `feat: CRUD kriteria, alternatif, kondisi`.

---

## Phase 5 — Input AHP + DB completeness

### Task 5.1: DB completeness helpers

**Files:** Modify `src/lib/completeness.ts` (tambah fungsi async)

- [ ] `getExpertCompleteness(modelId, expertId)`: hitung pairwise valid vs `getRequiredAhpPairCount(nKriteriaAktif)` dan strategy valid vs `getRequiredStrategyScoreCount(...)`. Return `{ ahp: {done,required,complete}, wp: {done,required,complete} }`.
- [ ] `getModelCompleteness(modelId)`: agregasi per expert aktif + flag bisa-publish.
- [ ] Commit `feat: helper kelengkapan berbasis DB`.

### Task 5.2: Input AHP page + action

**Files:** Create `src/app/(dashboard)/model-spk/[modelId]/ahp/page.tsx`, action `saveAhpComparisonsAction`, `src/lib/validations/ahp.ts`

- [ ] Validasi: `ahpComparisonSchema = z.object({ preference: z.enum(["LEFT","RIGHT","EQUAL"]), scale: z.number().int().min(1).max(9) })`. Jika EQUAL maka scale=1 (refine).
- [ ] Page: selector expert; generate `n(n-1)/2` pasangan kriteria aktif; tiap pasangan radio (Kiri/Sama/Kanan) + intensitas 1..9; progress "X/Y". Saat simpan: konversi ke `ratioValue` (LEFT→scale, RIGHT→1/scale, EQUAL→1), upsert `AhpComparison` (unik per model+expert+kiri+kanan). Blokir jika model ACTIVE.
- [ ] Card hasil sementara: hitung `calculateAhp` untuk expert terpilih → bobot, CI, CR (3 desimal) + badge konsisten. Peringatan jika CR > 0.1.
- [ ] Commit `feat: input pairwise AHP + hasil sementara`.

---

## Phase 6 — Input Nilai Strategi WP

### Task 6.1: Input nilai strategi page + action

**Files:** Create `src/app/(dashboard)/model-spk/[modelId]/nilai-strategi/page.tsx`, action `saveStrategyScoresAction`, `src/lib/validations/strategy.ts`

- [ ] Validasi `strategyScoreSchema = z.object({ value: z.number().int().min(1).max(5) })`.
- [ ] Page: filter expert + kondisi; tabel alternatif (baris) × kriteria (kolom) input integer 1..5; progress kelengkapan untuk kombinasi kondisi×alternatif×kriteria. Simpan upsert `StrategyScore` (unik per model+expert+kondisi+alternatif+kriteria). Blokir jika model ACTIVE.
- [ ] Tampilkan daftar sel yang belum diisi. Commit `feat: input nilai strategi WP`.

---

## Phase 7 — Simulasi + Hasil

### Task 7.1: calculateRecommendationAction (orkestrasi)

**Files:** Create `src/server/actions/calculation.ts`

- [ ] `calculateRecommendationAction({ modelId, conditionId, expertIds })` (requireSession): ambil kriteria aktif + comparisons expert terpilih → agregasi GM → `calculateAhp`; ambil strategy scores untuk kondisi + expert terpilih → agregasi rata-rata → `calculateWp` (pakai bobot AHP + jenis kriteria). Tolak jika ada expert terpilih belum lengkap atau nilai kosong (pesan ID). Return `{ ahpResult, wpResult }`. Opsional simpan `CalculationRun`.
- [ ] Commit `feat: orkestrasi perhitungan rekomendasi`.

### Task 7.2: Simulasi + Hasil page + komponen detail

**Files:** Create `src/app/(dashboard)/model-spk/[modelId]/simulasi/page.tsx`, `hasil/page.tsx`, `src/components/calculation/{ahp-detail,wp-detail,ranking-table}.tsx`

- [ ] Simulasi: pilih kondisi, checklist expert (multi; expert belum lengkap di-disable + label), tombol "Hitung Rekomendasi". Tampilkan card status CR, ranking table, dan tabs detail AHP (matriks pairwise, kolom sum, normalisasi, bobot, λmax, CI, CR) & WP (matriks nilai, exponent benefit/cost, S, ΣS, V, ranking). Semua angka 3 desimal via `formatDecimal`.
- [ ] `ranking-table.tsx`: tampilkan rank, kode, nama, S, V; tandai tie (rank sama) sesuai spec §6.5.
- [ ] Hasil page: ringkasan rekomendasi terbaik per kondisi + tombol Export PDF.
- [ ] Commit `feat: simulasi + hasil rekomendasi + detail perhitungan`.

---

## Phase 8 — Import XLSX

### Task 8.1: Parser XLSX (TDD)

**Files:** Create `src/lib/import/xlsx-parser.ts`, `src/lib/import/__tests__/xlsx-parser.test.ts`

- [ ] **Test gagal:** normalisasi header (`"Nama Expert"`→`nama_expert`); deteksi sheet AHP (`dummy_ahp_pairwise_long` / mengandung ahp+pairwise / header pairwise) & strategy (`Copy of dummy_strategy_long` / strategy+long / header); parsing `pilihan_form`: `"Kiri 2"`→ratio 2, `"Kanan 3"`→1/3, `"Sama"`/`"Sama 1"`→1; alias `preferensi`/`kiri_kode`/`kanan_kode`.
- [ ] Run vitest → FAIL.
- [ ] Implementasi parser pakai `XLSX.read(buffer)`, `sheet_to_json` raw, normalisasi kolom, ekstrak struktur (`experts`, `criteria`, `alternatives`, `conditions`, `pairwise[]`, `scores[]`). Andalkan kode bukan id spreadsheet.
- [ ] Run test → PASS. Commit `feat: parser XLSX AHP + WP + test`.

### Task 8.2: Validator import (TDD)

**Files:** Create `src/lib/import/import-validator.ts`, `__tests__/import-validator.test.ts`

- [ ] **Test gagal:** kode/nama kriteria tak kosong; jenis hanya benefit/cost; nilai strategi 1..5; nilai AHP 1..9; konsistensi `pilihan_form` vs `nilai_ahp`; tidak ada kombinasi duplikat; tidak ada kombinasi hilang (kondisi×alternatif×kriteria). Return list error berbahasa Indonesia + ringkasan count.
- [ ] Implementasi → test PASS. Commit `feat: validator import XLSX + test`.

### Task 8.3: Import service + preview API + page

**Files:** Create `src/lib/import/import-service.ts`, `src/app/api/import/preview/route.ts`, actions `confirmImportAction`, `src/app/(dashboard)/import-data/page.tsx`

- [ ] `import-service.ts` `createModelFromImport(parsed, modelName, userId)`: transaksi Prisma — buat DecisionModel DRAFT, experts, criteria, alternatives, conditions, ahpComparisons (dengan ratioValue+preference+scale), strategyScores. Rollback bila error.
- [ ] API `preview` (POST multipart): batasi `.xlsx`, parse + validate, return preview JSON (jumlah expert/kriteria/alternatif/kondisi/pairwise/strategy + error list). Tidak simpan.
- [ ] Page: upload file → preview → input nama model → tombol "Buat Model SPK dari Import" (panggil `confirmImportAction`, requireSession, buat model DRAFT). Tampilkan error ID jika gagal.
- [ ] Verifikasi manual dengan `PLAN/SPK-KOPERASI-IMPORT-2-SHEETS.xlsx` (1 expert, 6 kriteria, 7 alternatif, 5 kondisi, 15 pairwise, 210 nilai). Commit `feat: import XLSX jadi Model SPK baru`.

---

## Phase 9 — Export PDF + Finalisasi

### Task 9.1: Export PDF

**Files:** Create `src/app/api/export/pdf/route.ts`, `src/components/calculation/pdf-document.tsx`

- [ ] `@react-pdf/renderer` document: nama model, status, kondisi, expert dipakai, bobot kriteria, CR, tabel S & V, ranking, rekomendasi, tanggal export. Label Bahasa Indonesia, angka 3 desimal.
- [ ] API route hitung ulang (panggil orkestrasi) lalu stream PDF (`Content-Type: application/pdf`). Tombol di hasil page memanggil route.
- [ ] Commit `feat: export hasil ke PDF`.

### Task 9.2: README + verifikasi akhir

**Files:** Create `README.md`

- [ ] README (Bahasa Indonesia): judul, deskripsi, tech stack, cara install, setup `.env`, migrate+seed, akun default, cara import XLSX, penjelasan singkat AHP-WP, perintah test/build.
- [ ] Jalankan `npm run test` (semua lulus), `npm run build` (tanpa error TS), `npm run lint`. Perbaiki error.
- [ ] Commit `docs: README + finalisasi`.

---

## Self-Review

**Spec coverage:** FR-001..019 → Phase 3 (login/logout), 4 (model+CRUD), 5 (AHP), 6 (WP input), 7 (multi-expert selector + perhitungan + detail), 8 (import+validasi), 9 (export PDF). NFR presisi/bahasa/keamanan/maintainability/UI tercakup di konvensi + tiap task. Perhitungan AHP/WP (SRS §5-6) di Phase 2. Kelengkapan data (§7) di Task 2.4 + 5.1. Acceptance criteria §11 dipetakan ke Definition of Done guide §18.

**Catatan:** Export XLSX, grafik, riwayat run lanjutan, template kosong, audit log = nice-to-have → dibuat sebagai GitHub issues (di luar plan).

