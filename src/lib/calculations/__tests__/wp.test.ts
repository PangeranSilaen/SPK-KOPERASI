import { describe, it, expect } from "vitest";
import {
  aggregateStrategyScoresByAverage,
  calculateWp,
  type WpCriterion,
  type WpAlternative,
  type WpScore,
} from "@/lib/calculations/wp";

const criteria: WpCriterion[] = [
  { id: "c1", code: "C1", name: "Benefit 1", type: "BENEFIT", weight: 0.5 },
  { id: "c2", code: "C2", name: "Cost 1", type: "COST", weight: 0.5 },
];

const alternatives: WpAlternative[] = [
  { id: "a1", code: "A1", name: "Alt 1" },
  { id: "a2", code: "A2", name: "Alt 2" },
];

describe("aggregateStrategyScoresByAverage", () => {
  it("merata-ratakan nilai antar expert", () => {
    const expertScores: WpScore[][] = [
      [{ alternativeId: "a1", criterionId: "c1", value: 4 }],
      [{ alternativeId: "a1", criterionId: "c1", value: 2 }],
    ];
    const result = aggregateStrategyScoresByAverage(expertScores);
    expect(result).toHaveLength(1);
    expect(result[0].value).toBe(3);
  });

  it("mengembalikan nilai apa adanya jika satu expert", () => {
    const expertScores: WpScore[][] = [
      [{ alternativeId: "a1", criterionId: "c1", value: 5 }],
    ];
    const result = aggregateStrategyScoresByAverage(expertScores);
    expect(result[0].value).toBe(5);
  });
});

describe("calculateWp", () => {
  it("benefit memakai exponent positif dan cost negatif", () => {
    const scores: WpScore[] = [
      { alternativeId: "a1", criterionId: "c1", value: 4 },
      { alternativeId: "a1", criterionId: "c2", value: 2 },
      { alternativeId: "a2", criterionId: "c1", value: 3 },
      { alternativeId: "a2", criterionId: "c2", value: 5 },
    ];
    const res = calculateWp(criteria, alternatives, scores);
    const expC1 = res.weightedCriteria.find((w) => w.criterionId === "c1");
    const expC2 = res.weightedCriteria.find((w) => w.criterionId === "c2");
    expect(expC1?.exponent).toBeCloseTo(0.5, 10);
    expect(expC2?.exponent).toBeCloseTo(-0.5, 10);
  });

  it("nilai V berjumlah mendekati 1 dan ranking urut V terbesar", () => {
    const scores: WpScore[] = [
      { alternativeId: "a1", criterionId: "c1", value: 4 },
      { alternativeId: "a1", criterionId: "c2", value: 2 },
      { alternativeId: "a2", criterionId: "c1", value: 3 },
      { alternativeId: "a2", criterionId: "c2", value: 5 },
    ];
    const res = calculateWp(criteria, alternatives, scores);
    const sumV = res.vValues.reduce((acc, v) => acc + v.v, 0);
    expect(sumV).toBeCloseTo(1, 9);
    // A1: 4^0.5 * 2^-0.5 = sqrt(2) ~1.414 ; A2: 3^0.5 * 5^-0.5 = sqrt(0.6) ~0.775
    // A1 lebih besar => ranking 1
    expect(res.rankings[0].alternativeId).toBe("a1");
    expect(res.rankings[0].rank).toBe(1);
    expect(res.rankings[1].alternativeId).toBe("a2");
    expect(res.rankings[1].rank).toBe(2);
  });

  it("menandai tie jika selisih V <= 0.0005", () => {
    // Dua alternatif identik => V sama => tie (rank 1 keduanya), alternatif ke-3 rank 3.
    const altsTie: WpAlternative[] = [
      { id: "a1", code: "A1", name: "Alt 1" },
      { id: "a2", code: "A2", name: "Alt 2" },
      { id: "a3", code: "A3", name: "Alt 3" },
    ];
    const scores: WpScore[] = [
      { alternativeId: "a1", criterionId: "c1", value: 4 },
      { alternativeId: "a1", criterionId: "c2", value: 2 },
      { alternativeId: "a2", criterionId: "c1", value: 4 },
      { alternativeId: "a2", criterionId: "c2", value: 2 },
      { alternativeId: "a3", criterionId: "c1", value: 1 },
      { alternativeId: "a3", criterionId: "c2", value: 5 },
    ];
    const res = calculateWp(criteria, altsTie, scores);
    const r1 = res.rankings.find((r) => r.alternativeId === "a1");
    const r2 = res.rankings.find((r) => r.alternativeId === "a2");
    const r3 = res.rankings.find((r) => r.alternativeId === "a3");
    expect(r1?.rank).toBe(1);
    expect(r2?.rank).toBe(1);
    expect(r3?.rank).toBe(3);
  });
});
