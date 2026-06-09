import * as XLSX from "xlsx";

export type Preference = "LEFT" | "RIGHT" | "EQUAL";

export type ParsedPilihan = {
  preference: Preference;
  scale: number;
  ratio: number;
};

/**
 * Normalisasi header: trim, lowercase, ganti non-alfanumerik dengan underscore,
 * gabungkan underscore berlebih, dan hapus underscore di tepi.
 */
export function normalizeHeader(header: string): string {
  return String(header)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/**
 * Parse kolom `pilihan_form`:
 *   "Kiri n"  -> LEFT,  ratio = n
 *   "Kanan n" -> RIGHT, ratio = 1/n
 *   "Sama"/"Sama 1" -> EQUAL, ratio = 1
 */
export function parsePilihanForm(raw: string): ParsedPilihan {
  const text = String(raw ?? "").trim().toLowerCase();
  const numMatch = text.match(/(\d+(?:\.\d+)?)/);
  const num = numMatch ? Number(numMatch[1]) : 1;

  if (text.startsWith("kiri")) {
    return { preference: "LEFT", scale: num, ratio: num };
  }
  if (text.startsWith("kanan")) {
    return { preference: "RIGHT", scale: num, ratio: num === 0 ? 1 : 1 / num };
  }
  // "sama", "sama 1", atau lainnya dianggap sama penting.
  return { preference: "EQUAL", scale: 1, ratio: 1 };
}

/**
 * Cek konsistensi antara pilihan_form yang sudah diparse dengan nilai_ahp mentah.
 * Untuk EQUAL nilai_ahp harus 1; selain itu nilai_ahp harus sama dengan skala.
 */
export function preferenceFromParsed(parsed: ParsedPilihan, nilaiAhp: number): boolean {
  if (parsed.preference === "EQUAL") return nilaiAhp === 1;
  return Math.abs(parsed.scale - nilaiAhp) < 1e-9;
}

// ---------- Struktur hasil parsing ----------

export type ParsedExpert = { name: string; position?: string; experience?: string };
export type ParsedCriterion = { code: string; name: string; type?: "BENEFIT" | "COST" };
export type ParsedAlternative = { code: string; name: string };
export type ParsedCondition = { code: string; name: string };

export type ParsedPairwise = {
  expertName: string;
  leftCode: string;
  leftName: string;
  rightCode: string;
  rightName: string;
  pilihanForm: string;
  preference: Preference;
  scale: number;
  ratio: number;
  nilaiAhp: number;
  rowNumber: number;
};

export type ParsedScore = {
  expertName: string;
  conditionCode: string;
  conditionName: string;
  alternativeCode: string;
  alternativeName: string;
  criterionCode: string;
  criterionName: string;
  criterionType?: "BENEFIT" | "COST";
  value: number;
  rowNumber: number;
};

export type ParsedWorkbook = {
  experts: ParsedExpert[];
  criteria: ParsedCriterion[];
  alternatives: ParsedAlternative[];
  conditions: ParsedCondition[];
  pairwise: ParsedPairwise[];
  scores: ParsedScore[];
};

// Alias kolom -> nama kanonik.
const COLUMN_ALIASES: Record<string, string> = {
  preferensi: "pilihan_form",
  kiri_kode: "kriteria_kiri_kode",
  kanan_kode: "kriteria_kanan_kode",
};

function canonicalColumn(key: string): string {
  return COLUMN_ALIASES[key] ?? key;
}

/**
 * Konversi sheet menjadi array of objek dengan key ter-normalisasi.
 */
function sheetToRows(sheet: XLSX.WorkSheet): Array<Record<string, unknown>> {
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    raw: true,
    defval: "",
  });
  return raw.map((row) => {
    const norm: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(row)) {
      norm[canonicalColumn(normalizeHeader(k))] = v;
    }
    return norm;
  });
}

function headerKeys(sheet: XLSX.WorkSheet): string[] {
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    header: 1,
    raw: true,
  });
  const first = (rows[0] as unknown as unknown[]) ?? [];
  return first.map((h) => canonicalColumn(normalizeHeader(String(h))));
}

function str(v: unknown): string {
  return String(v ?? "").trim();
}

function num(v: unknown): number {
  if (typeof v === "number") return v;
  const n = Number(String(v).trim());
  return Number.isNaN(n) ? NaN : n;
}

/**
 * Deteksi sheet pairwise AHP.
 */
function findPairwiseSheet(wb: XLSX.WorkBook): XLSX.WorkSheet | null {
  // 1. Nama persis.
  if (wb.Sheets["dummy_ahp_pairwise_long"]) return wb.Sheets["dummy_ahp_pairwise_long"];
  // 2. Nama mengandung ahp + pairwise.
  for (const name of wb.SheetNames) {
    const n = name.toLowerCase();
    if (n.includes("ahp") && n.includes("pairwise")) return wb.Sheets[name];
  }
  // 3. Header mengandung kolom pairwise wajib.
  for (const name of wb.SheetNames) {
    const keys = headerKeys(wb.Sheets[name]);
    if (keys.includes("kriteria_kiri_kode") && keys.includes("pilihan_form")) {
      return wb.Sheets[name];
    }
  }
  return null;
}

/**
 * Deteksi sheet nilai strategi WP.
 */
function findStrategySheet(wb: XLSX.WorkBook): XLSX.WorkSheet | null {
  if (wb.Sheets["Copy of dummy_strategy_long"]) {
    return wb.Sheets["Copy of dummy_strategy_long"];
  }
  for (const name of wb.SheetNames) {
    const n = name.toLowerCase();
    if (n.includes("strategy") && n.includes("long")) return wb.Sheets[name];
  }
  for (const name of wb.SheetNames) {
    const keys = headerKeys(wb.Sheets[name]);
    if (
      keys.includes("kondisi_kode") &&
      keys.includes("alternatif_kode") &&
      keys.includes("kriteria_kode") &&
      keys.includes("nilai")
    ) {
      return wb.Sheets[name];
    }
  }
  return null;
}

export class ParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ParseError";
  }
}

/**
 * Parse buffer XLSX menjadi struktur ParsedWorkbook.
 * Melempar ParseError jika sheet wajib tidak ditemukan.
 */
export function parseWorkbook(buffer: Buffer | ArrayBuffer): ParsedWorkbook {
  const wb = XLSX.read(buffer, { type: "buffer" });

  const pairwiseSheet = findPairwiseSheet(wb);
  const strategySheet = findStrategySheet(wb);

  if (!pairwiseSheet) {
    throw new ParseError(
      "Sheet pairwise AHP tidak ditemukan. Pastikan ada sheet dengan kolom perbandingan kriteria.",
    );
  }
  if (!strategySheet) {
    throw new ParseError(
      "Sheet nilai strategi tidak ditemukan. Pastikan ada sheet dengan kolom kondisi, alternatif, kriteria, dan nilai.",
    );
  }

  const pairwiseRows = sheetToRows(pairwiseSheet);
  const strategyRows = sheetToRows(strategySheet);

  const expertMap = new Map<string, ParsedExpert>();
  const criterionMap = new Map<string, ParsedCriterion>();
  const alternativeMap = new Map<string, ParsedAlternative>();
  const conditionMap = new Map<string, ParsedCondition>();

  // ---------- Pairwise ----------
  const pairwise: ParsedPairwise[] = [];
  pairwiseRows.forEach((row, idx) => {
    const expertName = str(row["nama_expert"]);
    const leftCode = str(row["kriteria_kiri_kode"]);
    const leftName = str(row["kriteria_kiri_nama"]);
    const rightCode = str(row["kriteria_kanan_kode"]);
    const rightName = str(row["kriteria_kanan_nama"]);
    const pilihanForm = str(row["pilihan_form"]);
    const nilaiAhp = num(row["nilai_ahp"]);

    // Lewati baris kosong.
    if (!expertName && !leftCode && !rightCode) return;

    if (expertName && !expertMap.has(expertName)) {
      expertMap.set(expertName, {
        name: expertName,
        position: str(row["jabatan_expert"]) || undefined,
        experience: str(row["lama_pengalaman"]) || undefined,
      });
    }
    if (leftCode && !criterionMap.has(leftCode)) {
      criterionMap.set(leftCode, { code: leftCode, name: leftName });
    }
    if (rightCode && !criterionMap.has(rightCode)) {
      criterionMap.set(rightCode, { code: rightCode, name: rightName });
    }

    const parsed = parsePilihanForm(pilihanForm);
    pairwise.push({
      expertName,
      leftCode,
      leftName,
      rightCode,
      rightName,
      pilihanForm,
      preference: parsed.preference,
      scale: parsed.scale,
      ratio: parsed.ratio,
      nilaiAhp,
      rowNumber: idx + 2, // +2: header di baris 1, data mulai baris 2.
    });
  });

  // ---------- Strategy ----------
  const scores: ParsedScore[] = [];
  strategyRows.forEach((row, idx) => {
    const expertName = str(row["nama_expert"]);
    const conditionCode = str(row["kondisi_kode"]);
    const conditionName = str(row["kondisi_nama"]);
    const alternativeCode = str(row["alternatif_kode"]);
    const alternativeName = str(row["alternatif_nama"]);
    const criterionCode = str(row["kriteria_kode"]);
    const criterionName = str(row["kriteria_nama"]);
    const jenisRaw = str(row["jenis_kriteria"]).toLowerCase();
    const criterionType: "BENEFIT" | "COST" | undefined =
      jenisRaw === "benefit" ? "BENEFIT" : jenisRaw === "cost" ? "COST" : undefined;
    const value = num(row["nilai"]);

    if (!expertName && !conditionCode && !alternativeCode && !criterionCode) return;

    if (expertName && !expertMap.has(expertName)) {
      expertMap.set(expertName, {
        name: expertName,
        position: str(row["jabatan_expert"]) || undefined,
        experience: str(row["lama_pengalaman"]) || undefined,
      });
    }
    if (conditionCode && !conditionMap.has(conditionCode)) {
      conditionMap.set(conditionCode, { code: conditionCode, name: conditionName });
    }
    if (alternativeCode && !alternativeMap.has(alternativeCode)) {
      alternativeMap.set(alternativeCode, { code: alternativeCode, name: alternativeName });
    }
    // Lengkapi jenis kriteria dari sheet strategi (sumber paling otoritatif).
    if (criterionCode) {
      const existing = criterionMap.get(criterionCode);
      if (existing) {
        if (!existing.type && criterionType) existing.type = criterionType;
        if (!existing.name && criterionName) existing.name = criterionName;
      } else {
        criterionMap.set(criterionCode, {
          code: criterionCode,
          name: criterionName,
          type: criterionType,
        });
      }
    }

    scores.push({
      expertName,
      conditionCode,
      conditionName,
      alternativeCode,
      alternativeName,
      criterionCode,
      criterionName,
      criterionType,
      value,
      rowNumber: idx + 2,
    });
  });

  return {
    experts: [...expertMap.values()],
    criteria: [...criterionMap.values()],
    alternatives: [...alternativeMap.values()],
    conditions: [...conditionMap.values()],
    pairwise,
    scores,
  };
}
