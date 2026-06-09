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
import { logAudit } from "@/server/services/audit-service";

export type ActionResult = { ok: boolean; error?: string };

async function audit(
  modelId: string,
  action: string,
  entity: string,
  summary: string,
) {
  try {
    const user = await requireSession();
    await logAudit({ modelId, action, entity, summary, userId: user.id, userName: user.name });
  } catch {
    // abaikan kegagalan audit
  }
}

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

  await audit(
    modelId,
    "UPSERT",
    "Expert",
    `${id ? "Mengubah" : "Menambah"} expert "${data.name}".`,
  );
  revalidateModel(modelId, "expert");
  return { ok: true };
}

export async function deleteExpertAction(formData: FormData): Promise<void> {
  await requireSession();
  const modelId = String(formData.get("modelId") ?? "");
  const id = String(formData.get("id") ?? "");
  const guard = await ensureEditable(modelId);
  if (guard) return;
  const item = await prisma.expert.findUnique({ where: { id }, select: { name: true } });
  await prisma.expert.delete({ where: { id } });
  await audit(modelId, "DELETE", "Expert", `Menghapus expert "${item?.name ?? id}".`);
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

  await audit(
    modelId,
    "UPSERT",
    "Kriteria",
    `${id ? "Mengubah" : "Menambah"} kriteria ${parsed.data.code} - ${parsed.data.name}.`,
  );
  revalidateModel(modelId, "kriteria");
  return { ok: true };
}

export async function deleteCriterionAction(formData: FormData): Promise<void> {
  await requireSession();
  const modelId = String(formData.get("modelId") ?? "");
  const id = String(formData.get("id") ?? "");
  const guard = await ensureEditable(modelId);
  if (guard) return;
  const item = await prisma.criterion.findUnique({
    where: { id },
    select: { code: true, name: true },
  });
  await prisma.criterion.delete({ where: { id } });
  await audit(
    modelId,
    "DELETE",
    "Kriteria",
    `Menghapus kriteria ${item ? `${item.code} - ${item.name}` : id}.`,
  );
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

  await audit(
    modelId,
    "UPSERT",
    "Alternatif",
    `${id ? "Mengubah" : "Menambah"} alternatif ${data.code} - ${data.name}.`,
  );
  revalidateModel(modelId, "alternatif");
  return { ok: true };
}

export async function deleteAlternativeAction(formData: FormData): Promise<void> {
  await requireSession();
  const modelId = String(formData.get("modelId") ?? "");
  const id = String(formData.get("id") ?? "");
  const guard = await ensureEditable(modelId);
  if (guard) return;
  const item = await prisma.alternative.findUnique({
    where: { id },
    select: { code: true, name: true },
  });
  await prisma.alternative.delete({ where: { id } });
  await audit(
    modelId,
    "DELETE",
    "Alternatif",
    `Menghapus alternatif ${item ? `${item.code} - ${item.name}` : id}.`,
  );
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

  await audit(
    modelId,
    "UPSERT",
    "Kondisi",
    `${id ? "Mengubah" : "Menambah"} kondisi ${data.code} - ${data.name}.`,
  );
  revalidateModel(modelId, "kondisi");
  return { ok: true };
}

export async function deleteConditionAction(formData: FormData): Promise<void> {
  await requireSession();
  const modelId = String(formData.get("modelId") ?? "");
  const id = String(formData.get("id") ?? "");
  const guard = await ensureEditable(modelId);
  if (guard) return;
  const item = await prisma.condition.findUnique({
    where: { id },
    select: { code: true, name: true },
  });
  await prisma.condition.delete({ where: { id } });
  await audit(
    modelId,
    "DELETE",
    "Kondisi",
    `Menghapus kondisi ${item ? `${item.code} - ${item.name}` : id}.`,
  );
  revalidateModel(modelId, "kondisi");
}
