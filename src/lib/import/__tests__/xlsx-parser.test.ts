import { describe, it, expect } from "vitest";
import {
  normalizeHeader,
  parsePilihanForm,
  preferenceFromParsed,
} from "@/lib/import/xlsx-parser";

describe("normalizeHeader", () => {
  it("trim, lowercase, ganti spasi dengan underscore", () => {
    expect(normalizeHeader("Nama Expert")).toBe("nama_expert");
    expect(normalizeHeader("  Kondisi Kode  ")).toBe("kondisi_kode");
    expect(normalizeHeader("Jenis Kriteria")).toBe("jenis_kriteria");
  });

  it("menghapus karakter aneh", () => {
    expect(normalizeHeader("nilai (ahp)")).toBe("nilai_ahp");
  });
});

describe("parsePilihanForm", () => {
  it("Kiri n => kiri lebih penting, ratio = n", () => {
    const r = parsePilihanForm("Kiri 2");
    expect(r.preference).toBe("LEFT");
    expect(r.scale).toBe(2);
    expect(r.ratio).toBe(2);
  });

  it("Kanan n => kanan lebih penting, ratio = 1/n", () => {
    const r = parsePilihanForm("Kanan 3");
    expect(r.preference).toBe("RIGHT");
    expect(r.scale).toBe(3);
    expect(r.ratio).toBeCloseTo(1 / 3, 10);
  });

  it("Sama atau Sama 1 => sama penting, ratio = 1", () => {
    const a = parsePilihanForm("Sama");
    expect(a.preference).toBe("EQUAL");
    expect(a.ratio).toBe(1);
    const b = parsePilihanForm("Sama 1");
    expect(b.preference).toBe("EQUAL");
    expect(b.ratio).toBe(1);
  });

  it("toleran terhadap spasi dan kapitalisasi", () => {
    const r = parsePilihanForm("  kiri  5 ");
    expect(r.preference).toBe("LEFT");
    expect(r.scale).toBe(5);
  });
});

describe("preferenceFromParsed konsisten dengan nilai_ahp", () => {
  it("LEFT 2 cocok dengan nilai_ahp 2", () => {
    const r = parsePilihanForm("Kiri 2");
    expect(preferenceFromParsed(r, 2)).toBe(true);
  });
  it("RIGHT 3 cocok dengan nilai_ahp 3 (nilai mentah)", () => {
    const r = parsePilihanForm("Kanan 3");
    expect(preferenceFromParsed(r, 3)).toBe(true);
  });
  it("EQUAL cocok dengan nilai_ahp 1", () => {
    const r = parsePilihanForm("Sama");
    expect(preferenceFromParsed(r, 1)).toBe(true);
  });
  it("tidak cocok jika skala beda", () => {
    const r = parsePilihanForm("Kiri 2");
    expect(preferenceFromParsed(r, 5)).toBe(false);
  });
});
