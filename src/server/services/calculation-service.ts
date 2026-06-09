import "server-only";
import { prisma } from "@/lib/prisma";
import {
  aggregatePairwiseByGeometricMean,
  buildPairwiseMatrix,
  calculateAhp,
  type AhpCriterion,
  type AhpResult,
} from "@/lib/calculations/ahp";
import {
  aggregateStrategyScoresByAverage,
  calculateWp,
  type WpCriterion,
  type WpResult,
  type WpScore,
} from "@/lib/calculations/wp";
import { getRequiredAhpPairCount } from "@/lib/completeness";

export class CalculationError extends Error {
  problems: string[];
  constructor(message: string, problems: string[] = []) {
    super(message);
    this.name = "CalculationError";
    this.problems = problems;
  }
}

export type RecommendationResult = {
  model: { id: string; name: string; status: string };
  condition: { id: string; code: string; name: string };
  experts: Array<{ id: string; name: string }>;
  criteria: Array<{ id: string; code: string; name: string; type: "BENEFIT" | "COST" }>;
  ahp: AhpResult;
  wp: WpResult;
  bestAlternative: { code: string; name: string } | null;
};

/**
 * Hitung rekomendasi (AHP + WP) untuk satu kondisi dan kumpulan expert terpilih.
 * Melempar CalculationError jika data tidak lengkap.
 */
export async function calculateRecommendation(params: {
  modelId: string;
  conditionId: string;
  expertIds: string[];
}): Promise<RecommendationResult> {
  const { modelId, conditionId, expertIds } = params;

  if (expertIds.length === 0) {
    throw new CalculationError("Pilih minimal satu expert untuk perhitungan.");
  }

  const [model, condition, criteria, alternatives, experts] = await Promise.all([
    prisma.decisionModel.findUnique({
      where: { id: modelId },
      select: { id: true, name: true, status: true },
    }),
    prisma.condition.findUnique({
      where: { id: conditionId },
      select: { id: true, code: true, name: true },
    }),
    prisma.criterion.findMany({
      where: { modelId, isActive: true },
      orderBy: [{ order: "asc" }, { code: "asc" }],
      select: { id: true, code: true, name: true, type: true },
    }),
    prisma.alternative.findMany({
      where: { modelId, isActive: true },
      orderBy: [{ order: "asc" }, { code: "asc" }],
      select: { id: true, code: true, name: true },
    }),
    prisma.expert.findMany({
      where: { id: { in: expertIds }, modelId },
      select: { id: true, name: true },
    }),
  ]);

  if (!model) throw new CalculationError("Model tidak ditemukan.");
  if (!condition) throw new CalculationError("Kondisi tidak ditemukan.");
  if (criteria.length < 2) {
    throw new CalculationError("Minimal harus ada 2 kriteria aktif.");
  }
  if (alternatives.length < 1) {
    throw new CalculationError("Minimal harus ada 1 alternatif aktif.");
  }
  if (experts.length === 0) {
    throw new CalculationError("Expert terpilih tidak ditemukan dalam model ini.");
  }

  const problems: string[] = [];
  const requiredAhp = getRequiredAhpPairCount(criteria.length);
  const requiredWpPerCondition = alternatives.length * criteria.length;

  // Ambil data AHP & WP per expert.
  const ahpCriteria: AhpCriterion[] = criteria.map((c) => ({
    id: c.id,
    code: c.code,
    name: c.name,
  }));

  const expertPairwise: Array<
    Array<{ leftCriterionId: string; rightCriterionId: string; ratioValue: number }>
  > = [];
  const expertScores: WpScore[][] = [];

  for (const expert of experts) {
    const comparisons = await prisma.ahpComparison.findMany({
      where: { modelId, expertId: expert.id, ratioValue: { gt: 0 } },
      select: { leftCriterionId: true, rightCriterionId: true, ratioValue: true },
    });
    if (comparisons.length < requiredAhp) {
      problems.push(
        `Expert ${expert.name} belum melengkapi perbandingan AHP (${comparisons.length}/${requiredAhp}).`,
      );
    }
    expertPairwise.push(
      comparisons.map((c) => ({
        leftCriterionId: c.leftCriterionId,
        rightCriterionId: c.rightCriterionId,
        ratioValue: c.ratioValue,
      })),
    );

    const scores = await prisma.strategyScore.findMany({
      where: {
        modelId,
        expertId: expert.id,
        conditionId,
        value: { gte: 1, lte: 5 },
      },
      select: { alternativeId: true, criterionId: true, value: true },
    });
    if (scores.length < requiredWpPerCondition) {
      problems.push(
        `Expert ${expert.name} belum melengkapi nilai strategi untuk kondisi ${condition.code} (${scores.length}/${requiredWpPerCondition}).`,
      );
    }
    expertScores.push(
      scores.map((s) => ({
        alternativeId: s.alternativeId,
        criterionId: s.criterionId,
        value: s.value,
      })),
    );
  }

  if (problems.length > 0) {
    throw new CalculationError("Data belum lengkap untuk perhitungan.", problems);
  }

  // AHP: agregasi geometric mean lalu hitung.
  const aggregatedPairwise = aggregatePairwiseByGeometricMean(expertPairwise);
  const matrix = buildPairwiseMatrix(ahpCriteria, aggregatedPairwise);
  const ahp = calculateAhp(ahpCriteria, matrix);

  // WP: agregasi rata-rata lalu hitung dengan bobot AHP.
  const weightById = new Map(ahp.weights.map((w) => [w.criterionId, w.weight]));
  const wpCriteria: WpCriterion[] = criteria.map((c) => ({
    id: c.id,
    code: c.code,
    name: c.name,
    type: c.type,
    weight: weightById.get(c.id) ?? 0,
  }));
  const aggregatedScores = aggregateStrategyScoresByAverage(expertScores);
  const wp = calculateWp(
    wpCriteria,
    alternatives.map((a) => ({ id: a.id, code: a.code, name: a.name })),
    aggregatedScores,
  );

  const best = wp.rankings.find((r) => r.rank === 1) ?? null;

  return {
    model,
    condition,
    experts: experts.map((e) => ({ id: e.id, name: e.name })),
    criteria: criteria.map((c) => ({ id: c.id, code: c.code, name: c.name, type: c.type })),
    ahp,
    wp,
    bestAlternative: best ? { code: best.code, name: best.name } : null,
  };
}
