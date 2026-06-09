"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { expertSchema } from "@/lib/validations/expert";
import {
  alternativeSchema,
  conditionSchema,
  criterionSchema,
} from "@/lib/validations/entity";
import { assertEditable, ModelError } from "@/server/services/model-service";

export type ActionResult = { ok: boolean; error?: string };

async function ensureEditable(modelId: string): Promise<ActionResult | null> {
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
  return null;
}

function bool(formData: FormData, key: string): boolean {
  const v = formData.get(key);
  return v === "on" || v === "true" || v === "1";
}

function revalidateModel(modelId: string, sub: string) {
  revalidatePath(`/model-spk/${modelId}/${sub}`);
  revalidatePath(`/model-spk/${modelId}`);
}

// ---------- EXPERT ----------
export async function upsertExpertAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireSession();
  const modelId = String(formData.get("modelId") ?? "");
  const id = String(formData.get("id") ?? "");
  const guard = await ensureEditable(modelId);
  if (guard) return guard;

  const parsed = expertSchema.safeParse({
    name: formData.get("name"),
    position: formData.get("position") ?? "",
    experience: formData.get("experience") ?? "",
    notes: formData.get("notes") ?? "",
    isEnabled: bool(formData, "isEnabled"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  const data = {
    name: parsed.data.name,
    position: parsed.data.position || null,
    experience: parsed.data.experience || null,
    notes: parsed.data.notes || null,
    isEnabled: parsed.data.isEnabled,
  };

  try {
    if (id) {
      await prisma.expert.update({ where: { id }, data });
    } else {
      await prisma.expert.create({ data: { ...data, modelId } });
    }
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, error: "Nama expert sudah digunakan dalam model ini." };
    }
    throw e;
  }

  revalidateModel(modelId, "expert");
  return { ok: true };
}

export async function deleteExpertAction(formData: FormData): Promise<void> {
  await requireSession();
  const modelId = String(formData.get("modelId") ?? "");
  const id = String(formData.get("id") ?? "");
  const guard = await ensureEditable(modelId);
  if (guard) return;
  await prisma.expert.delete({ where: { id } });
  revalidateModel(modelId, "expert");
}

// ---------- CRITERION ----------
export async function upsertCriterionAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireSession();
  const modelId = String(formData.get("modelId") ?? "");
  const id = String(formData.get("id") ?? "");
  const guard = await ensureEditable(modelId);
  if (guard) return guard;

  const parsed = criterionSchema.safeParse({
    code: formData.get("code"),
    name: formData.get("name"),
    type: formData.get("type"),
    order: formData.get("order") ?? 0,
    isActive: bool(formData, "isActive"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  try {
    if (id) {
      await prisma.criterion.update({ where: { id }, data: parsed.data });
    } else {
      await prisma.criterion.create({ data: { ...parsed.data, modelId } });
    }
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, error: "Kode kriteria sudah digunakan dalam model ini." };
    }
    throw e;
  }

  revalidateModel(modelId, "kriteria");
  return { ok: true };
}

export async function deleteCriterionAction(formData: FormData): Promise<void> {
  await requireSession();
  const modelId = String(formData.get("modelId") ?? "");
  const id = String(formData.get("id") ?? "");
  const guard = await ensureEditable(modelId);
  if (guard) return;
  await prisma.criterion.delete({ where: { id } });
  revalidateModel(modelId, "kriteria");
}

// ---------- ALTERNATIVE ----------
export async function upsertAlternativeAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireSession();
  const modelId = String(formData.get("modelId") ?? "");
  const id = String(formData.get("id") ?? "");
  const guard = await ensureEditable(modelId);
  if (guard) return guard;

  const parsed = alternativeSchema.safeParse({
    code: formData.get("code"),
    name: formData.get("name"),
    description: formData.get("description") ?? "",
    order: formData.get("order") ?? 0,
    isActive: bool(formData, "isActive"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  const data = {
    code: parsed.data.code,
    name: parsed.data.name,
    description: parsed.data.description || null,
    order: parsed.data.order,
    isActive: parsed.data.isActive,
  };

  try {
    if (id) {
      await prisma.alternative.update({ where: { id }, data });
    } else {
      await prisma.alternative.create({ data: { ...data, modelId } });
    }
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, error: "Kode alternatif sudah digunakan dalam model ini." };
    }
    throw e;
  }

  revalidateModel(modelId, "alternatif");
  return { ok: true };
}

export async function deleteAlternativeAction(formData: FormData): Promise<void> {
  await requireSession();
  const modelId = String(formData.get("modelId") ?? "");
  const id = String(formData.get("id") ?? "");
  const guard = await ensureEditable(modelId);
  if (guard) return;
  await prisma.alternative.delete({ where: { id } });
  revalidateModel(modelId, "alternatif");
}

// ---------- CONDITION ----------
export async function upsertConditionAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireSession();
  const modelId = String(formData.get("modelId") ?? "");
  const id = String(formData.get("id") ?? "");
  const guard = await ensureEditable(modelId);
  if (guard) return guard;

  const parsed = conditionSchema.safeParse({
    code: formData.get("code"),
    name: formData.get("name"),
    description: formData.get("description") ?? "",
    order: formData.get("order") ?? 0,
    isActive: bool(formData, "isActive"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  const data = {
    code: parsed.data.code,
    name: parsed.data.name,
    description: parsed.data.description || null,
    order: parsed.data.order,
    isActive: parsed.data.isActive,
  };

  try {
    if (id) {
      await prisma.condition.update({ where: { id }, data });
    } else {
      await prisma.condition.create({ data: { ...data, modelId } });
    }
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, error: "Kode kondisi sudah digunakan dalam model ini." };
    }
    throw e;
  }

  revalidateModel(modelId, "kondisi");
  return { ok: true };
}

export async function deleteConditionAction(formData: FormData): Promise<void> {
  await requireSession();
  const modelId = String(formData.get("modelId") ?? "");
  const id = String(formData.get("id") ?? "");
  const guard = await ensureEditable(modelId);
  if (guard) return;
  await prisma.condition.delete({ where: { id } });
  revalidateModel(modelId, "kondisi");
}
