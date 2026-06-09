import "server-only";
import { prisma } from "@/lib/prisma";
import type { ParsedWorkbook } from "@/lib/import/xlsx-parser";

/**
 * Buat Model SPK baru berstatus DRAFT dari hasil parsing XLSX.
 * Seluruh operasi dilakukan dalam satu transaksi (rollback jika gagal).
 * Mengembalikan id model baru.
 */
export async function createModelFromImport(
  wb: ParsedWorkbook,
  modelName: string,
  createdById?: string,
): Promise<string> {
  return prisma.$transaction(async (tx) => {
    const model = await tx.decisionModel.create({
      data: {
        name: modelName,
        description: "Dibuat dari import XLSX.",
        status: "DRAFT",
        isDefault: false,
        createdById: createdById ?? null,
      },
    });

    // Experts.
    const expertIdByName = new Map<string, string>();
    for (const e of wb.experts) {
      const created = await tx.expert.create({
        data: {
          modelId: model.id,
          name: e.name,
          position: e.position ?? null,
          experience: e.experience ?? null,
          isEnabled: true,
        },
      });
      expertIdByName.set(e.name, created.id);
    }

    // Criteria.
    const criterionIdByCode = new Map<string, string>();
    let cOrder = 1;
    for (const c of wb.criteria) {
      const created = await tx.criterion.create({
        data: {
          modelId: model.id,
          code: c.code,
          name: c.name || c.code,
          type: c.type ?? "BENEFIT",
          order: cOrder++,
          isActive: true,
        },
      });
      criterionIdByCode.set(c.code, created.id);
    }

    // Alternatives.
    const alternativeIdByCode = new Map<string, string>();
    let aOrder = 1;
    for (const a of wb.alternatives) {
      const created = await tx.alternative.create({
        data: {
          modelId: model.id,
          code: a.code,
          name: a.name || a.code,
          order: aOrder++,
          isActive: true,
        },
      });
      alternativeIdByCode.set(a.code, created.id);
    }

    // Conditions.
    const conditionIdByCode = new Map<string, string>();
    let kOrder = 1;
    for (const k of wb.conditions) {
      const created = await tx.condition.create({
        data: {
          modelId: model.id,
          code: k.code,
          name: k.name || k.code,
          order: kOrder++,
          isActive: true,
        },
      });
      conditionIdByCode.set(k.code, created.id);
    }

    // Pairwise AHP.
    const ahpData = wb.pairwise
      .filter(
        (p) =>
          expertIdByName.has(p.expertName) &&
          criterionIdByCode.has(p.leftCode) &&
          criterionIdByCode.has(p.rightCode),
      )
      .map((p) => ({
        modelId: model.id,
        expertId: expertIdByName.get(p.expertName)!,
        leftCriterionId: criterionIdByCode.get(p.leftCode)!,
        rightCriterionId: criterionIdByCode.get(p.rightCode)!,
        preference: p.preference,
        scale: p.preference === "EQUAL" ? 1 : p.scale,
        ratioValue: p.ratio,
      }));
    if (ahpData.length > 0) {
      await tx.ahpComparison.createMany({ data: ahpData });
    }

    // Strategy scores.
    const scoreData = wb.scores
      .filter(
        (s) =>
          expertIdByName.has(s.expertName) &&
          conditionIdByCode.has(s.conditionCode) &&
          alternativeIdByCode.has(s.alternativeCode) &&
          criterionIdByCode.has(s.criterionCode),
      )
      .map((s) => ({
        modelId: model.id,
        expertId: expertIdByName.get(s.expertName)!,
        conditionId: conditionIdByCode.get(s.conditionCode)!,
        alternativeId: alternativeIdByCode.get(s.alternativeCode)!,
        criterionId: criterionIdByCode.get(s.criterionCode)!,
        value: Math.round(s.value),
      }));
    if (scoreData.length > 0) {
      await tx.strategyScore.createMany({ data: scoreData });
    }

    return model.id;
  });
}
