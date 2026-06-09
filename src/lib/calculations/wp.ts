import { assignRankings, type Ranking } from "@/lib/calculations/ranking";

export type WpCriterion = {
  id: string;
  code: string;
  name: string;
  type: "BENEFIT" | "COST";
  weight: number;
};

export type WpAlternative = {
  id: string;
  code: string;
  name: string;
};

export type WpScore = {
  alternativeId: string;
  criterionId: string;
  value: number;
};

export type WpWeightedCriterion = {
  criterionId: string;
  code: string;
  name: string;
  exponent: number;
};

export type WpSValue = {
  alternativeId: string;
  code: string;
  name: string;
  s: number;
};

export type WpVValue = WpSValue & { v: number };

export type WpResult = {
  weightedCriteria: WpWeightedCriterion[];
  sValues: WpSValue[];
  totalS: number;
  vValues: WpVValue[];
  rankings: Ranking[];
};

/**
 * Gabungkan nilai strategi dari beberapa expert memakai rata-rata aritmetika.
 * Alasan: nilai strategi adalah rating skala 1-5, bukan rasio pairwise.
 */
export function aggregateStrategyScoresByAverage(expertScores: WpScore[][]): WpScore[] {
  const valid = expertScores.filter((list) => list && list.length > 0);
  if (valid.length === 0) return [];
  if (valid.length === 1) return [...valid[0]];

  const map = new Map<string, { alt: string; crit: string; values: number[] }>();
  for (const list of valid) {
    for (const item of list) {
      const key = `${item.alternativeId}__${item.criterionId}`;
      const entry = map.get(key);
      if (entry) {
        entry.values.push(item.value);
      } else {
        map.set(key, {
          alt: item.alternativeId,
          crit: item.criterionId,
          values: [item.value],
        });
      }
    }
  }

  const result: WpScore[] = [];
  for (const { alt, crit, values } of map.values()) {
    const avg = values.reduce((acc, v) => acc + v, 0) / values.length;
    result.push({ alternativeId: alt, criterionId: crit, value: avg });
  }
  return result;
}

/**
 * Hitung WP penuh: exponent benefit/cost, nilai S, total S, nilai V, ranking.
 * Tidak melakukan rounding internal. Semua nilai score harus > 0.
 */
export function calculateWp(
  criteria: WpCriterion[],
  alternatives: WpAlternative[],
  scores: WpScore[],
): WpResult {
  // Exponent: benefit = +weight, cost = -weight.
  const weightedCriteria: WpWeightedCriterion[] = criteria.map((c) => ({
    criterionId: c.id,
    code: c.code,
    name: c.name,
    exponent: c.type === "COST" ? -c.weight : c.weight,
  }));
  const exponentByCriterion = new Map(weightedCriteria.map((w) => [w.criterionId, w.exponent]));

  // Index cepat nilai score.
  const scoreMap = new Map<string, number>();
  for (const s of scores) {
    scoreMap.set(`${s.alternativeId}__${s.criterionId}`, s.value);
  }

  // S_i = product(x_ij ^ p_j).
  const sValues: WpSValue[] = alternatives.map((alt) => {
    let s = 1;
    for (const c of criteria) {
      const value = scoreMap.get(`${alt.id}__${c.id}`);
      const exponent = exponentByCriterion.get(c.id) ?? 0;
      if (value !== undefined && value > 0) {
        s *= Math.pow(value, exponent);
      }
    }
    return { alternativeId: alt.id, code: alt.code, name: alt.name, s };
  });

  const totalS = sValues.reduce((acc, x) => acc + x.s, 0);

  // V_i = S_i / sumS.
  const vValues: WpVValue[] = sValues.map((x) => ({
    ...x,
    v: totalS === 0 ? 0 : x.s / totalS,
  }));

  const rankings = assignRankings(vValues);

  return {
    weightedCriteria,
    sValues,
    totalS,
    vValues,
    rankings,
  };
}
