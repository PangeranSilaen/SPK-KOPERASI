"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { saveAhpSchema, preferenceToRatio } from "@/lib/validations/ahp";
import { assertEditable, ModelError } from "@/server/services/model-service";
import { logAudit } from "@/server/services/audit-service";

export type SaveAhpResult = { ok: boolean; error?: string };

type ComparisonPayload = {
  leftCriterionId: string;
  rightCriterionId: string;
  preference: "LEFT" | "RIGHT" | "EQUAL";
  scale: number;
};

export async function saveAhpComparisonsAction(input: {
  modelId: string;
  expertId: string;
  comparisons: ComparisonPayload[];
}): Promise<SaveAhpResult> {
  const user = await requireSession();

  const parsed = saveAhpSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }
  const { modelId, expertId, comparisons } = parsed.data;

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

  // Upsert setiap perbandingan dalam transaksi.
  await prisma.$transaction(
    comparisons.map((c) => {
      const ratioValue = preferenceToRatio(c.preference, c.scale);
      const scale = c.preference === "EQUAL" ? 1 : c.scale;
      return prisma.ahpComparison.upsert({
        where: {
          modelId_expertId_leftCriterionId_rightCriterionId: {
            modelId,
            expertId,
            leftCriterionId: c.leftCriterionId,
            rightCriterionId: c.rightCriterionId,
          },
        },
        update: { preference: c.preference, scale, ratioValue },
        create: {
          modelId,
          expertId,
          leftCriterionId: c.leftCriterionId,
          rightCriterionId: c.rightCriterionId,
          preference: c.preference,
          scale,
          ratioValue,
        },
      });
    }),
  );

  const expert = await prisma.expert.findUnique({
    where: { id: expertId },
    select: { name: true },
  });
  await logAudit({
    modelId,
    action: "UPSERT",
    entity: "Penilaian AHP",
    summary: `Menyimpan penilaian AHP untuk expert "${expert?.name ?? expertId}".`,
    userId: user.id,
    userName: user.name,
  });

  revalidatePath(`/model-spk/${modelId}/ahp`);
  revalidatePath(`/model-spk/${modelId}`);
  return { ok: true };
}
