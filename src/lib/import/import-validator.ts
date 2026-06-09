import {
  parsePilihanForm,
  preferenceFromParsed,
  type ParsedWorkbook,
} from "@/lib/import/xlsx-parser";

export type ImportSummary = {
  expertCount: number;
  criteriaCount: number;
  alternativeCount: number;
  conditionCount: number;
  pairwiseCount: number;
  scoreCount: number;
};

export type ValidationResult = {
  errors: string[];
  warnings: string[];
  summary: ImportSummary;
};

/**
 * Validasi struktur ParsedWorkbook sebelum disimpan menjadi Model SPK.
 * Mengembalikan daftar error berbahasa Indonesia + ringkasan jumlah data.
 */
export function validateParsedWorkbook(wb: ParsedWorkbook): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // ---------- Validasi entitas dasar ----------
  if (wb.experts.length === 0) errors.push("Tidak ada data expert yang terbaca.");
  if (wb.criteria.length === 0) errors.push("Tidak ada data kriteria yang terbaca.");
  if (wb.alternatives.length === 0) errors.push("Tidak ada data alternatif yang terbaca.");
  if (wb.conditions.length === 0) errors.push("Tidak ada data kondisi yang terbaca.");

  for (const c of wb.criteria) {
    if (!c.code) errors.push("Terdapat kriteria dengan kode kosong.");
    if (!c.name) errors.push(`Kriteria ${c.code || "(tanpa kode)"} tidak memiliki nama.`);
    if (c.type !== "BENEFIT" && c.type !== "COST") {
      errors.push(
        `Kriteria ${c.code || "(tanpa kode)"} belum memiliki jenis benefit/cost yang valid.`,
      );
    }
  }
  for (const a of wb.alternatives) {
    if (!a.code) errors.push("Terdapat alternatif dengan kode kosong.");
  }
  for (const k of wb.conditions) {
    if (!k.code) errors.push("Terdapat kondisi dengan kode kosong.");
  }

  // ---------- Validasi pairwise AHP ----------
  for (const p of wb.pairwise) {
    if (!p.leftCode || !p.rightCode) {
      errors.push(`Baris ${p.rowNumber} (AHP): kode kriteria kiri/kanan tidak lengkap.`);
      continue;
    }
    if (!Number.isFinite(p.nilaiAhp) || p.nilaiAhp < 1 || p.nilaiAhp > 9) {
      errors.push(`Baris ${p.rowNumber} (AHP): nilai AHP harus berada antara 1 sampai 9.`);
    }
    // Cek konsistensi pilihan_form vs nilai_ahp.
    const parsed = parsePilihanForm(p.pilihanForm);
    if (Number.isFinite(p.nilaiAhp) && !preferenceFromParsed(parsed, p.nilaiAhp)) {
      warnings.push(
        `Baris ${p.rowNumber} (AHP): pilihan "${p.pilihanForm}" tidak konsisten dengan nilai AHP ${p.nilaiAhp}.`,
      );
    }
  }

  // Duplikasi pairwise per expert + pasangan kriteria.
  const pairwiseSeen = new Set<string>();
  for (const p of wb.pairwise) {
    const key = `${p.expertName}|${p.leftCode}|${p.rightCode}`;
    if (pairwiseSeen.has(key)) {
      errors.push(
        `Baris ${p.rowNumber} (AHP): kombinasi perbandingan duplikat untuk ${p.expertName} (${p.leftCode} vs ${p.rightCode}).`,
      );
    }
    pairwiseSeen.add(key);
  }

  // ---------- Validasi nilai strategi ----------
  for (const s of wb.scores) {
    if (!Number.isFinite(s.value) || s.value < 1 || s.value > 5) {
      errors.push(
        `Baris ${s.rowNumber} (Strategi): nilai strategi harus berada antara 1 sampai 5.`,
      );
    }
  }

  // Duplikasi & kelengkapan kombinasi (expert x kondisi x alternatif x kriteria).
  const scoreSeen = new Set<string>();
  for (const s of wb.scores) {
    const key = `${s.expertName}|${s.conditionCode}|${s.alternativeCode}|${s.criterionCode}`;
    if (scoreSeen.has(key)) {
      errors.push(
        `Baris ${s.rowNumber} (Strategi): kombinasi nilai duplikat (${s.expertName}, ${s.conditionCode}, ${s.alternativeCode}, ${s.criterionCode}).`,
      );
    }
    scoreSeen.add(key);
  }

  // Cek kombinasi yang hilang.
  const expectedCount =
    wb.experts.length *
    wb.conditions.length *
    wb.alternatives.length *
    wb.criteria.length;
  if (expectedCount > 0 && wb.scores.length < expectedCount) {
    const missing = expectedCount - wb.scores.length;
    errors.push(
      `Terdapat ${missing} kombinasi nilai strategi yang hilang (diharapkan ${expectedCount}, terbaca ${wb.scores.length}).`,
    );
  }

  const summary: ImportSummary = {
    expertCount: wb.experts.length,
    criteriaCount: wb.criteria.length,
    alternativeCount: wb.alternatives.length,
    conditionCount: wb.conditions.length,
    pairwiseCount: wb.pairwise.length,
    scoreCount: wb.scores.length,
  };

  return { errors, warnings, summary };
}
