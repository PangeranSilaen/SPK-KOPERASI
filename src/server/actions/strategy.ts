"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { saveStrategySchema } from "@/lib/validations/strategy";
import { assertEditable, ModelError } from "@/server/services/model-service";

export type SaveStrategyResult = { ok: boolean; error?: string };

type ScorePayload = {
  conditionId: string;
  alternativeId: string;
  criterionId: string;
  value: number;
};

export async function saveStrategyScoresAction(input: {
  modelId: string;
  expertId: string;
  conditionId: string;
  scores: ScorePayload[];
}): Promise<SaveStrategyResult> {
  await requireSession();

  const parsed = saveStrategySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }
  const { modelId, expertId, scores } = parsed.data;

  const model = await prisma.decisionModel.findUnique({
    where: { id: modelId },
    select: { status: true },
  });
  if (!model) return { ok: false, error: "Model tidak ditemukan." };
  try {
    assertEditable(model);
  } catch (e) {
    if (e instanceof ModelError) return { ok: false, error: e.message };
    throw e;
  }

  await prisma.$transaction(
    scores.map((s) =>
      prisma.strategyScore.upsert({
        where: {
          modelId_expertId_conditionId_alternativeId_criterionId: {
            modelId,
            expertId,
            conditionId: s.conditionId,
            alternativeId: s.alternativeId,
            criterionId: s.criterionId,
          },
        },
        update: { value: s.value },
        create: {
          modelId,
          expertId,
          conditionId: s.conditionId,
          alternativeId: s.alternativeId,
          criterionId: s.criterionId,
          value: s.value,
        },
      }),
    ),
  );

  revalidatePath(`/model-spk/${modelId}/nilai-strategi`);
  revalidatePath(`/model-spk/${modelId}`);
  return { ok: true };
}
