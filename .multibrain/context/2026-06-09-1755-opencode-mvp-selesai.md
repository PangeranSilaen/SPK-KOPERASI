# MVP SPK Koperasi Selesai

## Goal
Membangun website SPK Koperasi (AHP-WP) full MVP + export PDF secara autonomous sesuai PLAN/.

## Summary
Seluruh 9 fase selesai dan terverifikasi. Aplikasi dapat dijalankan (`npm run dev`), login, CRUD Model SPK + entitas, input AHP/WP, simulasi multi-expert, import XLSX, dan export PDF.

## Keputusan Penting
- **Package manager: npm** (pnpm tidak tersedia di environment).
- **Prisma 6** (bukan 7): Prisma 7 punya breaking changes besar (wajib driver adapter, `url` pindah ke prisma.config.ts). Downgrade ke v6 agar sesuai konvensi dokumen.
- **shadcn preset Base UI** (`base-nova`): komponen pakai `@base-ui/react`, jadi pola `asChild` Radix TIDAK ada. Gunakan `render={<Button .../>}` untuk trigger, dan `buttonVariants()` untuk Link-bergaya-button.
- Dialog form pakai pola `useTransition` + panggil server action langsung (bukan `useActionState`+`useEffect`) untuk lolos aturan lint `react-hooks/set-state-in-effect`.
- Tema dark Binance di-hardcode di `globals.css` (`.dark` block), root layout pakai `className="dark"`.
- `server-only` di service memblokir eksekusi via tsx murni — verifikasi end-to-end perhitungan dilakukan via unit test + parser test, bukan script tsx yang import service.

## Files Penting
- Perhitungan murni (teruji): `src/lib/calculations/{ahp,wp,ranking}.ts`, `src/lib/{format,ri-table,completeness}.ts`
- Import: `src/lib/import/{xlsx-parser,import-validator,import-service}.ts`
- Service: `src/server/services/{calculation,model,completeness}-service.ts`
- Actions: `src/server/actions/{auth,model,entities,ahp,strategy,calculation,import}.ts`
- Auth: `src/lib/auth.ts` (session cookie HMAC)
- PDF: `src/components/calculation/result-pdf.tsx` + `src/app/api/export/pdf/route.ts`
- Seed: `prisma/seed.ts` (admin@spk.test / admin12345)

## Verification
- `npm run test` → 33 lulus (6 file).
- `npm run build` → sukses, semua route ter-generate.
- `npm run lint` → 0 error, 0 warning.
- Parser XLSX file asli → 1/6/7/5/15/210, 0 error validasi.
- Render PDF → header %PDF- valid.

## Next / Catatan
- Nice-to-have dibuat sebagai GitHub issues: export XLSX, grafik bobot/ranking, riwayat calculation run UI, template XLSX kosong, audit log.
- Perubahan kriteria di model belum otomatis menghapus AHP/WP lama (hanya ditandai belum lengkap via hitung kelengkapan) — sesuai SRS.
- CRLF warning dari git di Windows bersifat normalisasi, aman.
