"use server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import {
  calculateRecommendation,
  CalculationError,
  type RecommendationResult,
} from "@/server/services/calculation-service";

export type CalculationActionResult =
  | { ok: true; result: RecommendationResult }
  | { ok: false; error: string; problems?: string[] };

export async function calculateRecommendationAction(input: {
  modelId: string;
  conditionId: string;
  expertIds: string[];
  customerName?: string;
}): Promise<CalculationActionResult> {
  const user = await requireSession();

  try {
    const result = await calculateRecommendation(input);

    // Simpan riwayat calculation run (untuk penelusuran rekomendasi per nasabah & export).
    await prisma.calculationRun.create({
      data: {
        modelId: input.modelId,
        conditionId: input.conditionId,
        conditionLabel: `${result.condition.code} - ${result.condition.name}`,
        customerName: input.customerName?.trim() || null,
        bestAlternative: result.bestAlternative
          ? `${result.bestAlternative.code} - ${result.bestAlternative.name}`
          : null,
        consistencyRatio: result.ahp.cr,
        isConsistent: result.ahp.isConsistent,
        selectedExpertIds: input.expertIds,
        ahpResult: JSON.parse(JSON.stringify(result.ahp)),
        wpResult: JSON.parse(JSON.stringify(result.wp)),
        createdById: user.id,
      },
    });

    return { ok: true, result };
  } catch (e) {
    if (e instanceof CalculationError) {
      return { ok: false, error: e.message, problems: e.problems };
    }
    throw e;
  }
}
