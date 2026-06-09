# 03 - Implementation Guide: SPK-KOPERASI

## 1. Tujuan Dokumen

Dokumen ini adalah instruksi teknis untuk coding agent agar membangun website **SPK Koperasi** sesuai PRD dan SRS.

Coding agent harus membaca dokumen berikut secara berurutan:

```text
PLAN/01-PRD.md
PLAN/02-SRS.md
PLAN/03-IMPLEMENTATION-GUIDE.md
```

Aplikasi harus dibangun sebagai website berbahasa Indonesia dengan metode AHP-WP, login, Model SPK, import XLSX, multi-expert selector, dan detail perhitungan.

---

## 2. Tech Stack Final

Gunakan stack berikut:

| Bagian | Teknologi |
|---|---|
| Framework | Next.js App Router |
| Bahasa | TypeScript |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | Session-based auth sederhana atau Auth.js jika lebih cepat dan stabil |
| UI | Tailwind CSS + shadcn/ui |
| Design reference | DESIGN.md Binance dari getdesign.md |
| Spreadsheet import/export | SheetJS `xlsx` |
| Validasi | Zod |
| Password hashing | bcryptjs atau bcrypt |
| PDF export | @react-pdf/renderer atau HTML print-to-PDF jika lebih cepat |
| Package manager | pnpm direkomendasikan, npm boleh jika environment tidak mendukung pnpm |

Catatan:

1. Jangan memakai Python backend.
2. Jangan memakai spreadsheet sebagai mesin hitung.
3. Semua perhitungan AHP-WP harus berada di backend/server logic.
4. UI wajib Bahasa Indonesia.

---

## 3. Aturan Lokasi Folder

Instruksi PRD/SRS diletakkan di folder `PLAN/` satu level di luar project root agar folder utama tidak terisi sebelum framework diinstall.

Contoh struktur awal:

```text
parent-folder/
├── PLAN/
│   ├── 01-PRD.md
│   ├── 02-SRS.md
│   └── 03-IMPLEMENTATION-GUIDE.md
```

Coding agent tidak boleh membuat aplikasi Next.js di dalam folder `PLAN/`.

Buat project sebagai sibling folder:

```text
parent-folder/
├── PLAN/
└── SPK-KOPERASI/
```

Setelah project dibuat, boleh copy folder PLAN ke dalam repo jika developer ingin menyimpan dokumen perencanaan di repository:

```bash
cp -R ../PLAN ./PLAN
```

---

## 4. Setup Repository dengan GitHub CLI

Pastikan GitHub CLI sudah login:

```bash
gh auth status || gh auth login
```

Dari folder yang berisi `PLAN/`, buat folder project:

```bash
mkdir SPK-KOPERASI
cd SPK-KOPERASI
```

Buat Next.js app di folder kosong:

```bash
pnpm create next-app@latest . --ts --tailwind --eslint --app --src-dir --import-alias "@/*"
```

Jika memakai npm:

```bash
npx create-next-app@latest . --ts --tailwind --eslint --app --src-dir --import-alias "@/*"
```

Install dependency utama:

```bash
pnpm add @prisma/client zod bcryptjs xlsx lucide-react
pnpm add -D prisma
```

Opsional untuk export PDF:

```bash
pnpm add @react-pdf/renderer
```

Inisialisasi git dan buat repo GitHub:

```bash
git init
git add .
git commit -m "chore: initialize SPK Koperasi project"
gh repo create SPK-KOPERASI --private --source=. --remote=origin --push
```

Jika repo diminta public, ganti `--private` menjadi `--public`.

---

## 5. Install DESIGN.md Binance dan shadcn/ui

Di root project `SPK-KOPERASI`, jalankan:

```bash
npx getdesign@latest add binance
```

Perintah tersebut harus menghasilkan atau menambahkan file DESIGN.md di root project.

Install shadcn/ui:

```bash
pnpm dlx shadcn@latest init
```

Tambahkan komponen dasar:

```bash
pnpm dlx shadcn@latest add button card input label table tabs badge dialog dropdown-menu select textarea separator alert form checkbox sidebar progress sonner
```

Instruksi UI:

```text
Use shadcn/ui as the component base.
Use DESIGN.md as the visual design source of truth.
Customize shadcn components to match Binance-style tokens from DESIGN.md.
Do not add random UI libraries unless necessary.
```

Aplikasi harus terlihat seperti dashboard profesional dengan aksen Binance yellow, dark-friendly surface, tabel rapi, card informatif, dan form yang mudah dipahami.

---

## 6. Setup Prisma dan PostgreSQL

Inisialisasi Prisma:

```bash
pnpm prisma init
```

Isi `.env`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
SESSION_SECRET="replace-with-random-secret"
```

Untuk development lokal, boleh gunakan Docker PostgreSQL.

Contoh `docker-compose.yml`:

```yaml
services:
  postgres:
    image: postgres:16
    container_name: spk_koperasi_postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: spk_user
      POSTGRES_PASSWORD: spk_password
      POSTGRES_DB: spk_koperasi
    ports:
      - "5432:5432"
    volumes:
      - spk_koperasi_pgdata:/var/lib/postgresql/data

volumes:
  spk_koperasi_pgdata:
```

Jika memakai docker compose:

```bash
docker compose up -d
```

---

## 7. Prisma Schema yang Disarankan

Buat schema yang mendukung versioning Model SPK, multi-expert, AHP, WP, dan calculation run.

Contoh struktur utama:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum ModelStatus {
  DRAFT
  ACTIVE
  ARCHIVED
}

enum CriterionType {
  BENEFIT
  COST
}

enum PairwisePreference {
  LEFT
  RIGHT
  EQUAL
}

model User {
  id           String   @id @default(cuid())
  name         String
  email        String   @unique
  passwordHash String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  createdModels DecisionModel[]
  calculationRuns CalculationRun[]
}

model DecisionModel {
  id          String      @id @default(cuid())
  name        String
  description String?
  status      ModelStatus @default(DRAFT)
  isDefault   Boolean     @default(false)
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  createdById String?
  createdBy   User?       @relation(fields: [createdById], references: [id])

  experts      Expert[]
  criteria     Criterion[]
  alternatives Alternative[]
  conditions   Condition[]
  ahpComparisons AhpComparison[]
  strategyScores StrategyScore[]
  calculationRuns CalculationRun[]

  @@index([status])
}

model Expert {
  id              String   @id @default(cuid())
  modelId         String
  model           DecisionModel @relation(fields: [modelId], references: [id], onDelete: Cascade)

  name            String
  position        String?
  experience      String?
  notes           String?
  isEnabled       Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  ahpComparisons  AhpComparison[]
  strategyScores  StrategyScore[]

  @@unique([modelId, name])
  @@index([modelId])
}

model Criterion {
  id        String        @id @default(cuid())
  modelId   String
  model     DecisionModel @relation(fields: [modelId], references: [id], onDelete: Cascade)

  code      String
  name      String
  type      CriterionType
  order     Int           @default(0)
  isActive  Boolean       @default(true)
  createdAt DateTime      @default(now())
  updatedAt DateTime      @updatedAt

  leftComparisons  AhpComparison[] @relation("LeftCriterion")
  rightComparisons AhpComparison[] @relation("RightCriterion")
  strategyScores   StrategyScore[]

  @@unique([modelId, code])
  @@index([modelId])
}

model Alternative {
  id          String        @id @default(cuid())
  modelId     String
  model       DecisionModel @relation(fields: [modelId], references: [id], onDelete: Cascade)

  code        String
  name        String
  description String?
  order       Int           @default(0)
  isActive    Boolean       @default(true)
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  strategyScores StrategyScore[]

  @@unique([modelId, code])
  @@index([modelId])
}

model Condition {
  id          String        @id @default(cuid())
  modelId     String
  model       DecisionModel @relation(fields: [modelId], references: [id], onDelete: Cascade)

  code        String
  name        String
  description String?
  order       Int           @default(0)
  isActive    Boolean       @default(true)
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  strategyScores StrategyScore[]

  @@unique([modelId, code])
  @@index([modelId])
}

model AhpComparison {
  id String @id @default(cuid())

  modelId String
  model   DecisionModel @relation(fields: [modelId], references: [id], onDelete: Cascade)

  expertId String
  expert   Expert @relation(fields: [expertId], references: [id], onDelete: Cascade)

  leftCriterionId String
  leftCriterion   Criterion @relation("LeftCriterion", fields: [leftCriterionId], references: [id], onDelete: Cascade)

  rightCriterionId String
  rightCriterion   Criterion @relation("RightCriterion", fields: [rightCriterionId], references: [id], onDelete: Cascade)

  preference PairwisePreference
  scale      Int
  ratioValue Float

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([modelId, expertId, leftCriterionId, rightCriterionId])
  @@index([modelId, expertId])
}

model StrategyScore {
  id String @id @default(cuid())

  modelId String
  model   DecisionModel @relation(fields: [modelId], references: [id], onDelete: Cascade)

  expertId String
  expert   Expert @relation(fields: [expertId], references: [id], onDelete: Cascade)

  conditionId String
  condition   Condition @relation(fields: [conditionId], references: [id], onDelete: Cascade)

  alternativeId String
  alternative   Alternative @relation(fields: [alternativeId], references: [id], onDelete: Cascade)

  criterionId String
  criterion   Criterion @relation(fields: [criterionId], references: [id], onDelete: Cascade)

  value Int

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([modelId, expertId, conditionId, alternativeId, criterionId])
  @@index([modelId, expertId])
  @@index([modelId, conditionId])
}

model CalculationRun {
  id String @id @default(cuid())

  modelId String
  model   DecisionModel @relation(fields: [modelId], references: [id], onDelete: Cascade)

  conditionId String?
  selectedExpertIds Json

  ahpResult Json
  wpResult  Json

  createdById String?
  createdBy   User? @relation(fields: [createdById], references: [id])

  createdAt DateTime @default(now())

  @@index([modelId])
}
```

Setelah schema dibuat:

```bash
pnpm prisma migrate dev --name init
pnpm prisma generate
```

---

## 8. Seed Data

Buat seed script `prisma/seed.ts`.

Seed wajib:

1. Akun admin.
2. Model SPK Default berstatus Draf atau Aktif.
3. Expert default.
4. 6 kriteria default.
5. 7 alternatif default.
6. 5 kondisi default.

Akun default:

```text
Email: admin@spk.test
Password: admin12345
```

Data default boleh belum lengkap AHP dan WP, tetapi dashboard harus menunjukkan status `Belum lengkap`.

Tambahkan di `package.json`:

```json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

Install tsx jika perlu:

```bash
pnpm add -D tsx
```

Jalankan:

```bash
pnpm prisma db seed
```

---

## 9. Struktur Folder yang Disarankan

```text
src/
├── app/
│   ├── (auth)/
│   │   └── login/
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   ├── model-spk/
│   │   │   ├── page.tsx
│   │   │   ├── [modelId]/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── expert/
│   │   │   │   ├── kriteria/
│   │   │   │   ├── alternatif/
│   │   │   │   ├── kondisi/
│   │   │   │   ├── ahp/
│   │   │   │   ├── nilai-strategi/
│   │   │   │   ├── simulasi/
│   │   │   │   └── hasil/
│   │   ├── import-data/
│   │   └── pengaturan/
│   ├── api/
│   │   ├── auth/
│   │   ├── import/
│   │   ├── export/
│   │   └── calculation/
│   └── layout.tsx
├── components/
│   ├── ui/
│   ├── layout/
│   ├── forms/
│   ├── tables/
│   └── calculation/
├── lib/
│   ├── auth.ts
│   ├── prisma.ts
│   ├── validations/
│   ├── calculations/
│   │   ├── ahp.ts
│   │   ├── wp.ts
│   │   └── ranking.ts
│   ├── import/
│   │   ├── xlsx-parser.ts
│   │   ├── import-validator.ts
│   │   └── import-service.ts
│   └── format.ts
└── server/
    ├── actions/
    └── services/
```

---

## 10. Modul Perhitungan

Buat file:

```text
src/lib/calculations/ahp.ts
src/lib/calculations/wp.ts
src/lib/calculations/ranking.ts
```

### 10.1 `ahp.ts`

Export fungsi:

```ts
export type AhpCriterion = {
  id: string
  code: string
  name: string
}

export type AhpPairwiseInput = {
  leftCriterionId: string
  rightCriterionId: string
  ratioValue: number
}

export function aggregatePairwiseByGeometricMean(
  expertInputs: AhpPairwiseInput[][]
): AhpPairwiseInput[]

export function buildPairwiseMatrix(
  criteria: AhpCriterion[],
  comparisons: AhpPairwiseInput[]
): number[][]

export function calculateAhp(criteria: AhpCriterion[], matrix: number[][]): {
  matrix: number[][]
  columnSums: number[]
  normalizedMatrix: number[][]
  weights: Array<{ criterionId: string; code: string; name: string; weight: number }>
  lambdaMax: number
  ci: number
  cr: number
  isConsistent: boolean
}
```

Aturan:

1. Jangan rounding internal.
2. Gunakan rounding hanya untuk display.
3. CR valid jika `cr <= 0.1`.
4. Jika n <= 2, CR = 0.

---

### 10.2 `wp.ts`

Export fungsi:

```ts
export type WpCriterion = {
  id: string
  code: string
  name: string
  type: "BENEFIT" | "COST"
  weight: number
}

export type WpAlternative = {
  id: string
  code: string
  name: string
}

export type WpScore = {
  alternativeId: string
  criterionId: string
  value: number
}

export function aggregateStrategyScoresByAverage(
  expertScores: WpScore[][]
): WpScore[]

export function calculateWp(
  criteria: WpCriterion[],
  alternatives: WpAlternative[],
  scores: WpScore[]
): {
  weightedCriteria: Array<{ criterionId: string; exponent: number }>
  sValues: Array<{ alternativeId: string; code: string; name: string; s: number }>
  totalS: number
  vValues: Array<{ alternativeId: string; code: string; name: string; s: number; v: number }>
  rankings: Array<{ rank: number; alternativeId: string; code: string; name: string; s: number; v: number }>
}
```

Aturan:

1. Benefit exponent positif.
2. Cost exponent negatif.
3. Nilai score harus lebih dari 0.
4. Tie jika selisih `v <= 0.0005`.
5. Ranking berdasarkan nilai V terbesar.

---

### 10.3 `format.ts`

Buat helper:

```ts
export function formatDecimal(value: number): string {
  return value.toFixed(3)
}
```

Gunakan helper ini di seluruh UI dan export.

---

## 11. Validasi dengan Zod

Buat schema validasi untuk:

1. Login.
2. Model SPK.
3. Expert.
4. Kriteria.
5. Alternatif.
6. Kondisi.
7. AHP comparison.
8. Strategy score.
9. Import preview.

Contoh strategy score:

```ts
const strategyScoreSchema = z.object({
  value: z.number().int().min(1).max(5),
})
```

Contoh pairwise:

```ts
const ahpComparisonSchema = z.object({
  preference: z.enum(["LEFT", "RIGHT", "EQUAL"]),
  scale: z.number().int().min(1).max(9),
})
```

Jika preference `EQUAL`, scale harus 1.

---

## 12. Import XLSX Implementation

Gunakan SheetJS `xlsx`.

### 12.1 Parsing

Alur:

```text
User upload XLSX
↓
Server baca file buffer
↓
XLSX.read(buffer)
↓
Ambil sheet pairwise dan strategy long
↓
Convert sheet ke JSON
↓
Normalisasi nama kolom
↓
Validasi
↓
Preview
↓
User confirm + isi nama Model SPK
↓
Simpan sebagai Model SPK Draf
```

### 12.2 Sheet Detection

Cari sheet dengan prioritas:

1. Nama persis `dummy_ahp_pairwise_long`.
2. Nama mengandung `ahp` dan `pairwise`.
3. Header mengandung kolom pairwise wajib.

Untuk nilai strategi:

1. Nama persis `Copy of dummy_strategy_long`.
2. Nama mengandung `strategy` dan `long`.
3. Header mengandung kolom kondisi, alternatif, kriteria, dan nilai.

### 12.3 Column Normalization

Normalisasi header:

1. Trim spasi.
2. Lowercase.
3. Ganti spasi dengan underscore.
4. Hapus karakter aneh jika perlu.

Contoh:

```text
Nama Expert -> nama_expert
kondisi kode -> kondisi_kode
Jenis Kriteria -> jenis_kriteria
```

### 12.4 Import Transaction

Simpan data dengan transaksi database:

```text
create model
create experts
create criteria
create alternatives
create conditions
create ahp comparisons
create strategy scores
```

Jika ada error, rollback semua.

---

## 13. Halaman dan Komponen UI

### 13.1 Login

Path:

```text
/login
```

Komponen:

1. Form email.
2. Form password.
3. Button `Masuk`.
4. Error alert.

---

### 13.2 Dashboard

Path:

```text
/dashboard
```

Isi:

1. Card Model SPK Aktif.
2. Card jumlah kriteria.
3. Card jumlah alternatif.
4. Card jumlah kondisi.
5. Card jumlah expert.
6. Ringkasan rekomendasi per kondisi.
7. Tombol `Import Data`.
8. Tombol `Kelola Model SPK`.

---

### 13.3 Model SPK

Path:

```text
/model-spk
/model-spk/[modelId]
```

Isi list:

1. Nama model.
2. Status.
3. Jumlah data.
4. Tombol lihat.
5. Tombol duplikat.
6. Tombol publish jika draf valid.

---

### 13.4 Input AHP

Path:

```text
/model-spk/[modelId]/ahp
```

UI:

1. Pilih expert.
2. Progress jumlah pairwise.
3. Form pairwise satu per pasangan kriteria.
4. Button `Simpan Penilaian AHP`.
5. Card hasil sementara: bobot, CI, CR.

---

### 13.5 Input Nilai Strategi

Path:

```text
/model-spk/[modelId]/nilai-strategi
```

UI:

1. Pilih expert.
2. Pilih kondisi.
3. Table alternatif x kriteria.
4. Input skala 1 sampai 5.
5. Progress kelengkapan.
6. Button simpan.

---

### 13.6 Simulasi Perhitungan

Path:

```text
/model-spk/[modelId]/simulasi
```

UI:

1. Pilih kondisi nasabah.
2. Checklist expert yang digunakan.
3. Tombol `Hitung Rekomendasi`.
4. Card status CR.
5. Tabel ranking.
6. Detail AHP dan WP dalam tabs.

---

### 13.7 Import Data

Path:

```text
/import-data
```

UI:

1. Upload XLSX.
2. Preview data.
3. Input nama Model SPK baru.
4. Validasi error.
5. Button `Buat Model SPK dari Import`.

---

## 14. Server Actions atau API Routes

Gunakan Server Actions untuk form sederhana. Gunakan API Routes untuk upload file jika lebih mudah.

Mutasi yang diperlukan:

1. `loginAction`
2. `logoutAction`
3. `createModelAction`
4. `duplicateModelAction`
5. `publishModelAction`
6. `archiveModelAction`
7. `upsertExpertAction`
8. `upsertCriterionAction`
9. `upsertAlternativeAction`
10. `upsertConditionAction`
11. `saveAhpComparisonsAction`
12. `saveStrategyScoresAction`
13. `calculateRecommendationAction`
14. `previewImportAction`
15. `confirmImportAction`
16. `exportPdfAction`

Semua action harus validasi session.

---

## 15. Publish Model Validation

Sebelum Model Draf dipublish, validasi:

1. Minimal ada 1 expert aktif dan lengkap.
2. Minimal ada 2 kriteria aktif.
3. Minimal ada 1 alternatif aktif.
4. Minimal ada 1 kondisi aktif.
5. Pairwise AHP lengkap untuk expert aktif yang digunakan default.
6. Nilai strategi lengkap untuk expert aktif yang digunakan default.
7. CR gabungan expert default <= 0,1.
8. Tidak ada duplikasi kode.

Jika validasi gagal, tampilkan daftar masalah.

Contoh:

```text
Model belum dapat dipublish karena:
- Expert Bapak Ahmad belum mengisi 3 perbandingan AHP.
- Kondisi K5 masih memiliki 12 nilai strategi kosong.
- Rasio Konsistensi saat ini 0.142, melebihi batas 0.1.
```

---

## 16. Data Completeness Helpers

Buat helper:

```ts
getRequiredAhpPairCount(criteriaCount: number): number
getRequiredStrategyScoreCount(conditionCount: number, alternativeCount: number, criterionCount: number): number
getExpertCompleteness(modelId: string, expertId: string): Promise<...>
getModelCompleteness(modelId: string): Promise<...>
```

Tampilkan progress seperti:

```text
AHP: 15/15 lengkap
Nilai Strategi: 210/210 lengkap
```

---

## 17. Testing Minimal

Buat unit test untuk:

1. AHP matrix reciprocal.
2. Geometric mean multi-expert.
3. Bobot AHP total mendekati 1.
4. CR dihitung.
5. WP benefit dan cost.
6. Tie ranking.
7. Format 3 desimal.
8. Validasi nilai strategi 1 sampai 5.

Testing framework bebas. Disarankan Vitest jika cepat.

Install:

```bash
pnpm add -D vitest
```

---

## 18. Definition of Done

Project dianggap selesai jika:

1. `pnpm install` berhasil.
2. `pnpm prisma migrate dev` berhasil.
3. `pnpm prisma db seed` berhasil.
4. `pnpm dev` menjalankan aplikasi.
5. Login default berhasil.
6. Dashboard tampil.
7. CRUD Model SPK berjalan.
8. CRUD expert, kriteria, alternatif, dan kondisi berjalan.
9. Input AHP berjalan.
10. Perhitungan AHP menampilkan bobot dan CR.
11. Input WP berjalan.
12. Simulasi rekomendasi berjalan.
13. Multi-expert selector berjalan.
14. Import XLSX membuat Model SPK baru.
15. Hasil perhitungan tampil 3 desimal.
16. UI Bahasa Indonesia.
17. Desain mengikuti DESIGN.md Binance.
18. Tidak ada data nasabah disimpan.
19. Tidak ada error TypeScript dan lint utama.
20. README berisi cara setup dan menjalankan project.

---

## 19. README yang Harus Dibuat

Buat `README.md` di root repo dengan isi minimal:

1. Judul project.
2. Deskripsi singkat.
3. Tech stack.
4. Cara install.
5. Cara setup `.env`.
6. Cara menjalankan database.
7. Cara migrate dan seed.
8. Akun login default.
9. Cara import XLSX.
10. Penjelasan singkat AHP-WP.

Contoh akun default:

```text
Email: admin@spk.test
Password: admin12345
```

---

## 20. Larangan Implementasi

1. Jangan menyimpan nama nasabah, NIK, nomor telepon, alamat, atau data pribadi nasabah.
2. Jangan memakai formula spreadsheet untuk hasil final.
3. Jangan membuat role kompleks.
4. Jangan membuat aplikasi di dalam folder PLAN.
5. Jangan mengubah Model Aktif langsung.
6. Jangan membulatkan angka saat perhitungan internal.
7. Jangan memakai random UI library selain yang disetujui.
8. Jangan menampilkan UI utama dalam Bahasa Inggris.

---

## 21. Prioritas Pengerjaan

Urutan pengerjaan yang disarankan:

1. Setup repo, Next.js, Prisma, shadcn/ui, DESIGN.md.
2. Auth dan seed user.
3. Database schema dan seed Model SPK default.
4. Layout dashboard.
5. CRUD Model SPK.
6. CRUD expert, kriteria, alternatif, kondisi.
7. Modul perhitungan AHP dan unit test.
8. Input AHP.
9. Modul perhitungan WP dan unit test.
10. Input nilai strategi.
11. Simulasi hasil rekomendasi.
12. Multi-expert selector.
13. Import XLSX.
14. Detail perhitungan.
15. Export PDF.
16. Polish UI Bahasa Indonesia.
17. README dan final check.

---

## 22. Referensi Teknis untuk Coding Agent

Gunakan dokumentasi resmi terbaru saat implementasi:

1. Next.js App Router dan Server Functions.
2. Prisma ORM dengan PostgreSQL.
3. shadcn/ui untuk Next.js.
4. SheetJS untuk parsing XLSX.
5. GitHub CLI `gh repo create`.
6. getdesign.md untuk DESIGN.md Binance.

Jangan mengandalkan contoh lama jika dokumentasi resmi sudah berubah.
