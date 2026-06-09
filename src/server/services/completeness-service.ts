import "server-only";
import { prisma } from "@/lib/prisma";
import {
  getRequiredAhpPairCount,
  getRequiredStrategyScoreCount,
} from "@/lib/completeness";

export type ExpertCompleteness = {
  expertId: string;
  expertName: string;
  isEnabled: boolean;
  ahp: { done: number; required: number; complete: boolean };
  wp: { done: number; required: number; complete: boolean };
  complete: boolean;
};

export type ModelCompleteness = {
  criteriaCount: number;
  alternativeCount: number;
  conditionCount: number;
  expertCount: number;
  requiredAhp: number;
  requiredWp: number;
  experts: ExpertCompleteness[];
  hasCompleteExpert: boolean;
};

/**
 * Hitung kelengkapan AHP & WP untuk satu expert dalam sebuah model.
 * Pairwise valid: ratioValue > 0. Nilai strategi valid: value antara 1-5.
 */
export async function getExpertCompleteness(
  modelId: string,
  expertId: string,
): Promise<ExpertCompleteness> {
  const [criteriaCount, alternativeCount, conditionCount, expert, ahpDone, wpDone] =
    await Promise.all([
      prisma.criterion.count({ where: { modelId, isActive: true } }),
      prisma.alternative.count({ where: { modelId, isActive: true } }),
      prisma.condition.count({ where: { modelId, isActive: true } }),
      prisma.expert.findUnique({ where: { id: expertId } }),
      prisma.ahpComparison.count({ where: { modelId, expertId, ratioValue: { gt: 0 } } }),
      prisma.strategyScore.count({
        where: { modelId, expertId, value: { gte: 1, lte: 5 } },
      }),
    ]);

  const requiredAhp = getRequiredAhpPairCount(criteriaCount);
  const requiredWp = getRequiredStrategyScoreCount(
    conditionCount,
    alternativeCount,
    criteriaCount,
  );

  const ahpComplete = requiredAhp > 0 && ahpDone >= requiredAhp;
  const wpComplete = requiredWp > 0 && wpDone >= requiredWp;

  return {
    expertId,
    expertName: expert?.name ?? "Tidak diketahui",
    isEnabled: expert?.isEnabled ?? false,
    ahp: { done: ahpDone, required: requiredAhp, complete: ahpComplete },
    wp: { done: wpDone, required: requiredWp, complete: wpComplete },
    complete: ahpComplete && wpComplete,
  };
}

/**
 * Hitung kelengkapan keseluruhan model + tiap expert.
 */
export async function getModelCompleteness(modelId: string): Promise<ModelCompleteness> {
  const [criteriaCount, alternativeCount, conditionCount, experts] = await Promise.all([
    prisma.criterion.count({ where: { modelId, isActive: true } }),
    prisma.alternative.count({ where: { modelId, isActive: true } }),
    prisma.condition.count({ where: { modelId, isActive: true } }),
    prisma.expert.findMany({ where: { modelId }, orderBy: { name: "asc" } }),
  ]);

  const requiredAhp = getRequiredAhpPairCount(criteriaCount);
  const requiredWp = getRequiredStrategyScoreCount(
    conditionCount,
    alternativeCount,
    criteriaCount,
  );

  const expertCompleteness = await Promise.all(
    experts.map((e) => getExpertCompleteness(modelId, e.id)),
  );

  const hasCompleteExpert = expertCompleteness.some((e) => e.isEnabled && e.complete);

  return {
    criteriaCount,
    alternativeCount,
    conditionCount,
    expertCount: experts.length,
    requiredAhp,
    requiredWp,
    experts: expertCompleteness,
    hasCompleteExpert,
  };
}
