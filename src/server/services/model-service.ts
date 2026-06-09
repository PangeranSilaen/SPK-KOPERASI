import "server-only";
import { prisma } from "@/lib/prisma";
import { getModelCompleteness } from "@/server/services/completeness-service";
import type { DecisionModel } from "@prisma/client";

/**
 * Error domain untuk operasi model yang ingin ditampilkan ke user.
 */
export class ModelError extends Error {
  problems: string[];
  constructor(message: string, problems: string[] = []) {
    super(message);
    this.name = "ModelError";
    this.problems = problems;
  }
}

/**
 * Pastikan model dapat diedit (tidak berstatus ACTIVE).
 */
export function assertEditable(model: Pick<DecisionModel, "status">): void {
  if (model.status === "ACTIVE") {
    throw new ModelError(
      "Model aktif tidak dapat diedit langsung. Duplikat model terlebih dahulu.",
    );
  }
  if (model.status === "ARCHIVED") {
    throw new ModelError("Model arsip tidak dapat diedit. Duplikat model terlebih dahulu.");
  }
}

/**
 * Duplikasi model menjadi Draf baru, termasuk seluruh entitas dan penilaian.
 * Mengembalikan model baru.
 */
export async function duplicateModel(
  sourceModelId: string,
  createdById?: string,
): Promise<DecisionModel> {
  const source = await prisma.decisionModel.findUnique({
    where: { id: sourceModelId },
    include: {
      experts: true,
      criteria: true,
      alternatives: true,
      conditions: true,
      ahpComparisons: true,
      strategyScores: true,
    },
  });

  if (!source) {
    throw new ModelError("Model sumber tidak ditemukan.");
  }

  return prisma.$transaction(async (tx) => {
    const newModel = await tx.decisionModel.create({
      data: {
        name: `Salinan dari ${source.name}`,
        description: source.description,
        status: "DRAFT",
        isDefault: false,
        createdById: createdById ?? source.createdById,
      },
    });

    // Salin entitas sambil membangun peta id lama -> id baru.
    const expertMap = new Map<string, string>();
    for (const e of source.experts) {
      const created = await tx.expert.create({
        data: {
          modelId: newModel.id,
          name: e.name,
          position: e.position,
          experience: e.experience,
          notes: e.notes,
          isEnabled: e.isEnabled,
        },
      });
      expertMap.set(e.id, created.id);
    }

    const criterionMap = new Map<string, string>();
    for (const c of source.criteria) {
      const created = await tx.criterion.create({
        data: {
          modelId: newModel.id,
          code: c.code,
          name: c.name,
          type: c.type,
          order: c.order,
          isActive: c.isActive,
        },
      });
      criterionMap.set(c.id, created.id);
    }

    const alternativeMap = new Map<string, string>();
    for (const a of source.alternatives) {
      const created = await tx.alternative.create({
        data: {
          modelId: newModel.id,
          code: a.code,
          name: a.name,
          description: a.description,
          order: a.order,
          isActive: a.isActive,
        },
      });
      alternativeMap.set(a.id, created.id);
    }

    const conditionMap = new Map<string, string>();
    for (const k of source.conditions) {
      const created = await tx.condition.create({
        data: {
          modelId: newModel.id,
          code: k.code,
          name: k.name,
          description: k.description,
          order: k.order,
          isActive: k.isActive,
        },
      });
      conditionMap.set(k.id, created.id);
    }

    // Salin pairwise AHP.
    if (source.ahpComparisons.length > 0) {
      await tx.ahpComparison.createMany({
        data: source.ahpComparisons
          .filter(
            (cmp) =>
              expertMap.has(cmp.expertId) &&
              criterionMap.has(cmp.leftCriterionId) &&
              criterionMap.has(cmp.rightCriterionId),
          )
          .map((cmp) => ({
            modelId: newModel.id,
            expertId: expertMap.get(cmp.expertId)!,
            leftCriterionId: criterionMap.get(cmp.leftCriterionId)!,
            rightCriterionId: criterionMap.get(cmp.rightCriterionId)!,
            preference: cmp.preference,
            scale: cmp.scale,
            ratioValue: cmp.ratioValue,
          })),
      });
    }

    // Salin nilai strategi.
    if (source.strategyScores.length > 0) {
      await tx.strategyScore.createMany({
        data: source.strategyScores
          .filter(
            (s) =>
              expertMap.has(s.expertId) &&
              conditionMap.has(s.conditionId) &&
              alternativeMap.has(s.alternativeId) &&
              criterionMap.has(s.criterionId),
          )
          .map((s) => ({
            modelId: newModel.id,
            expertId: expertMap.get(s.expertId)!,
            conditionId: conditionMap.get(s.conditionId)!,
            alternativeId: alternativeMap.get(s.alternativeId)!,
            criterionId: criterionMap.get(s.criterionId)!,
            value: s.value,
          })),
      });
    }

    return newModel;
  });
}

/**
 * Validasi sebelum publish (Implementation Guide §15).
 * Mengembalikan daftar masalah (kosong jika valid).
 */
export async function validatePublish(modelId: string): Promise<string[]> {
  const problems: string[] = [];

  const [criteriaCount, alternativeCount, conditionCount] = await Promise.all([
    prisma.criterion.count({ where: { modelId, isActive: true } }),
    prisma.alternative.count({ where: { modelId, isActive: true } }),
    prisma.condition.count({ where: { modelId, isActive: true } }),
  ]);

  if (criteriaCount < 2) problems.push("Minimal harus ada 2 kriteria aktif.");
  if (alternativeCount < 1) problems.push("Minimal harus ada 1 alternatif aktif.");
  if (conditionCount < 1) problems.push("Minimal harus ada 1 kondisi aktif.");

  const completeness = await getModelCompleteness(modelId);
  const enabledExperts = completeness.experts.filter((e) => e.isEnabled);

  if (enabledExperts.length === 0) {
    problems.push("Minimal harus ada 1 expert aktif.");
  }

  for (const e of enabledExperts) {
    if (!e.ahp.complete) {
      problems.push(
        `Expert ${e.expertName} belum melengkapi perbandingan AHP (${e.ahp.done}/${e.ahp.required}).`,
      );
    }
    if (!e.wp.complete) {
      problems.push(
        `Expert ${e.expertName} belum melengkapi nilai strategi (${e.wp.done}/${e.wp.required}).`,
      );
    }
  }

  return problems;
}

/**
 * Publish model Draf menjadi Aktif. Model aktif sebelumnya menjadi Arsip.
 */
export async function publishModel(modelId: string): Promise<void> {
  const model = await prisma.decisionModel.findUnique({ where: { id: modelId } });
  if (!model) throw new ModelError("Model tidak ditemukan.");
  if (model.status === "ACTIVE") throw new ModelError("Model sudah berstatus aktif.");

  const problems = await validatePublish(modelId);
  if (problems.length > 0) {
    throw new ModelError("Model belum dapat dipublish.", problems);
  }

  await prisma.$transaction(async (tx) => {
    await tx.decisionModel.updateMany({
      where: { status: "ACTIVE" },
      data: { status: "ARCHIVED", isDefault: false },
    });
    await tx.decisionModel.update({
      where: { id: modelId },
      data: { status: "ACTIVE", isDefault: true },
    });
  });
}

/**
 * Arsipkan model.
 */
export async function archiveModel(modelId: string): Promise<void> {
  const model = await prisma.decisionModel.findUnique({ where: { id: modelId } });
  if (!model) throw new ModelError("Model tidak ditemukan.");
  await prisma.decisionModel.update({
    where: { id: modelId },
    data: { status: "ARCHIVED", isDefault: false },
  });
}

/**
 * Kembalikan model dari Arsip menjadi Draf agar dapat diedit kembali.
 */
export async function restoreModel(modelId: string): Promise<void> {
  const model = await prisma.decisionModel.findUnique({ where: { id: modelId } });
  if (!model) throw new ModelError("Model tidak ditemukan.");
  if (model.status !== "ARCHIVED") {
    throw new ModelError("Hanya model berstatus Arsip yang dapat dikembalikan.");
  }
  await prisma.decisionModel.update({
    where: { id: modelId },
    data: { status: "DRAFT", isDefault: false },
  });
}

/**
 * Hapus model beserta seluruh entitas terkait (cascade).
 * Model AKTIF tidak boleh dihapus langsung — harus diarsipkan dulu.
 */
export async function deleteModel(modelId: string): Promise<void> {
  const model = await prisma.decisionModel.findUnique({ where: { id: modelId } });
  if (!model) throw new ModelError("Model tidak ditemukan.");
  if (model.status === "ACTIVE") {
    throw new ModelError(
      "Model aktif tidak dapat dihapus. Arsipkan model terlebih dahulu.",
    );
  }
  await prisma.decisionModel.delete({ where: { id: modelId } });
}
