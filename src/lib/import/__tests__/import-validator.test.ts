import { describe, it, expect } from "vitest";
import { validateParsedWorkbook } from "@/lib/import/import-validator";
import type { ParsedWorkbook } from "@/lib/import/xlsx-parser";

function baseWorkbook(): ParsedWorkbook {
  return {
    experts: [{ name: "Expert A" }],
    criteria: [
      { code: "C1", name: "Kriteria 1", type: "BENEFIT" },
      { code: "C2", name: "Kriteria 2", type: "COST" },
    ],
    alternatives: [
      { code: "A1", name: "Alt 1" },
      { code: "A2", name: "Alt 2" },
    ],
    conditions: [{ code: "K1", name: "Kondisi 1" }],
    pairwise: [
      {
        expertName: "Expert A",
        leftCode: "C1",
        leftName: "Kriteria 1",
        rightCode: "C2",
        rightName: "Kriteria 2",
        pilihanForm: "Kiri 2",
        preference: "LEFT",
        scale: 2,
        ratio: 2,
        nilaiAhp: 2,
        rowNumber: 2,
      },
    ],
    scores: [],
  };
}

function fullScores(): ParsedWorkbook["scores"] {
  const scores: ParsedWorkbook["scores"] = [];
  let row = 2;
  for (const cond of ["K1"]) {
    for (const alt of ["A1", "A2"]) {
      for (const crit of ["C1", "C2"]) {
        scores.push({
          expertName: "Expert A",
          conditionCode: cond,
          conditionName: "Kondisi 1",
          alternativeCode: alt,
          alternativeName: "Alt",
          criterionCode: crit,
          criterionName: "Kriteria",
          criterionType: crit === "C2" ? "COST" : "BENEFIT",
          value: 3,
          rowNumber: row++,
        });
      }
    }
  }
  return scores;
}

describe("validateParsedWorkbook", () => {
  it("workbook lengkap valid tanpa error", () => {
    const wb = baseWorkbook();
    wb.scores = fullScores();
    const res = validateParsedWorkbook(wb);
    expect(res.errors).toHaveLength(0);
    expect(res.summary.expertCount).toBe(1);
    expect(res.summary.criteriaCount).toBe(2);
    expect(res.summary.scoreCount).toBe(4);
  });

  it("menolak nilai strategi di luar 1-5", () => {
    const wb = baseWorkbook();
    wb.scores = fullScores();
    wb.scores[0].value = 7;
    const res = validateParsedWorkbook(wb);
    expect(res.errors.some((e) => e.includes("1 sampai 5"))).toBe(true);
  });

  it("menolak jenis kriteria yang bukan benefit/cost", () => {
    const wb = baseWorkbook();
    wb.scores = fullScores();
    wb.criteria[0].type = undefined;
    const res = validateParsedWorkbook(wb);
    expect(res.errors.some((e) => e.includes("benefit") || e.includes("cost"))).toBe(true);
  });

  it("menolak nilai_ahp di luar 1-9", () => {
    const wb = baseWorkbook();
    wb.scores = fullScores();
    wb.pairwise[0].nilaiAhp = 12;
    const res = validateParsedWorkbook(wb);
    expect(res.errors.some((e) => e.includes("AHP"))).toBe(true);
  });

  it("mendeteksi kombinasi nilai strategi yang hilang", () => {
    const wb = baseWorkbook();
    wb.scores = fullScores();
    wb.scores.pop(); // hapus satu kombinasi
    const res = validateParsedWorkbook(wb);
    expect(res.errors.some((e) => e.toLowerCase().includes("hilang") || e.toLowerCase().includes("kurang"))).toBe(true);
  });

  it("mendeteksi kombinasi nilai strategi duplikat", () => {
    const wb = baseWorkbook();
    wb.scores = fullScores();
    wb.scores.push({ ...wb.scores[0], rowNumber: 99 });
    const res = validateParsedWorkbook(wb);
    expect(res.errors.some((e) => e.toLowerCase().includes("duplikat"))).toBe(true);
  });

  it("menolak kode kriteria kosong", () => {
    const wb = baseWorkbook();
    wb.scores = fullScores();
    wb.criteria[0].code = "";
    const res = validateParsedWorkbook(wb);
    expect(res.errors.length).toBeGreaterThan(0);
  });
});
