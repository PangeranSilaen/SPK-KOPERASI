import { describe, it, expect } from "vitest";
import {
  getRequiredAhpPairCount,
  getRequiredStrategyScoreCount,
} from "@/lib/completeness";

describe("getRequiredAhpPairCount", () => {
  it("menghitung n(n-1)/2", () => {
    expect(getRequiredAhpPairCount(6)).toBe(15);
    expect(getRequiredAhpPairCount(7)).toBe(21);
    expect(getRequiredAhpPairCount(1)).toBe(0);
    expect(getRequiredAhpPairCount(0)).toBe(0);
  });
});

describe("getRequiredStrategyScoreCount", () => {
  it("menghitung kondisi * alternatif * kriteria", () => {
    expect(getRequiredStrategyScoreCount(5, 7, 6)).toBe(210);
    expect(getRequiredStrategyScoreCount(0, 7, 6)).toBe(0);
  });
});
