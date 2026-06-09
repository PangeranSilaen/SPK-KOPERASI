import { describe, it, expect } from "vitest";
import {
  aggregatePairwiseByGeometricMean,
  buildPairwiseMatrix,
  calculateAhp,
  type AhpCriterion,
  type AhpPairwiseInput,
} from "@/lib/calculations/ahp";

const criteria: AhpCriterion[] = [
  { id: "c1", code: "C1", name: "Kriteria 1" },
  { id: "c2", code: "C2", name: "Kriteria 2" },
  { id: "c3", code: "C3", name: "Kriteria 3" },
];

describe("aggregatePairwiseByGeometricMean", () => {
  it("menghitung geometric mean dari beberapa expert", () => {
    const expertInputs: AhpPairwiseInput[][] = [
      [{ leftCriterionId: "c1", rightCriterionId: "c2", ratioValue: 3 }],
      [{ leftCriterionId: "c1", rightCriterionId: "c2", ratioValue: 5 }],
    ];
    const result = aggregatePairwiseByGeometricMean(expertInputs);
    expect(result).toHaveLength(1);
    expect(result[0].ratioValue).toBeCloseTo(Math.sqrt(15), 10);
  });

  it("mengembalikan nilai apa adanya jika hanya satu expert", () => {
    const expertInputs: AhpPairwiseInput[][] = [
      [{ leftCriterionId: "c1", rightCriterionId: "c2", ratioValue: 4 }],
    ];
    const result = aggregatePairwiseByGeometricMean(expertInputs);
    expect(result[0].ratioValue).toBe(4);
  });
});

describe("buildPairwiseMatrix", () => {
  it("membentuk matriks reciprocal dengan diagonal 1", () => {
    const comparisons: AhpPairwiseInput[] = [
      { leftCriterionId: "c1", rightCriterionId: "c2", ratioValue: 2 },
      { leftCriterionId: "c1", rightCriterionId: "c3", ratioValue: 4 },
      { leftCriterionId: "c2", rightCriterionId: "c3", ratioValue: 2 },
    ];
    const m = buildPairwiseMatrix(criteria, comparisons);
    // diagonal 1
    expect(m[0][0]).toBe(1);
    expect(m[1][1]).toBe(1);
    expect(m[2][2]).toBe(1);
    // nilai yang diisi
    expect(m[0][1]).toBe(2);
    expect(m[0][2]).toBe(4);
    expect(m[1][2]).toBe(2);
    // reciprocal
    expect(m[1][0]).toBeCloseTo(1 / 2, 10);
    expect(m[2][0]).toBeCloseTo(1 / 4, 10);
    expect(m[2][1]).toBeCloseTo(1 / 2, 10);
  });
});

describe("calculateAhp", () => {
  it("bobot berjumlah mendekati 1", () => {
    const comparisons: AhpPairwiseInput[] = [
      { leftCriterionId: "c1", rightCriterionId: "c2", ratioValue: 2 },
      { leftCriterionId: "c1", rightCriterionId: "c3", ratioValue: 4 },
      { leftCriterionId: "c2", rightCriterionId: "c3", ratioValue: 2 },
    ];
    const matrix = buildPairwiseMatrix(criteria, comparisons);
    const res = calculateAhp(criteria, matrix);
    const sum = res.weights.reduce((acc, w) => acc + w.weight, 0);
    expect(sum).toBeCloseTo(1, 9);
  });

  it("matriks konsisten sempurna menghasilkan CR mendekati 0", () => {
    // Matriks dari rasio bobot w=[0.5,0.3,0.2] => konsisten sempurna
    const w = [0.5, 0.3, 0.2];
    const matrix = w.map((wi) => w.map((wj) => wi / wj));
    const res = calculateAhp(criteria, matrix);
    expect(res.cr).toBeCloseTo(0, 6);
    expect(res.isConsistent).toBe(true);
    expect(res.weights[0].weight).toBeCloseTo(0.5, 6);
    expect(res.weights[1].weight).toBeCloseTo(0.3, 6);
    expect(res.weights[2].weight).toBeCloseTo(0.2, 6);
  });

  it("CR dianggap 0 jika n <= 2", () => {
    const twoCriteria: AhpCriterion[] = [
      { id: "c1", code: "C1", name: "K1" },
      { id: "c2", code: "C2", name: "K2" },
    ];
    const matrix = [
      [1, 3],
      [1 / 3, 1],
    ];
    const res = calculateAhp(twoCriteria, matrix);
    expect(res.cr).toBe(0);
    expect(res.isConsistent).toBe(true);
  });

  it("mengembalikan lambdaMax, ci, dan kolomSums", () => {
    const comparisons: AhpPairwiseInput[] = [
      { leftCriterionId: "c1", rightCriterionId: "c2", ratioValue: 2 },
      { leftCriterionId: "c1", rightCriterionId: "c3", ratioValue: 4 },
      { leftCriterionId: "c2", rightCriterionId: "c3", ratioValue: 2 },
    ];
    const matrix = buildPairwiseMatrix(criteria, comparisons);
    const res = calculateAhp(criteria, matrix);
    expect(res.lambdaMax).toBeGreaterThanOrEqual(3 - 1e-9);
    expect(res.ci).toBeGreaterThanOrEqual(-1e-9);
    expect(res.columnSums).toHaveLength(3);
    expect(res.normalizedMatrix).toHaveLength(3);
  });
});
