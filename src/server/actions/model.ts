"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { modelSchema } from "@/lib/validations/model";
import {
  ModelError,
  archiveModel,
  restoreModel,
  deleteModel,
  duplicateModel,
  publishModel,
} from "@/server/services/model-service";
import { logAudit } from "@/server/services/audit-service";

export type ActionResult = {
  ok: boolean;
  error?: string;
  problems?: string[];
};

export async function createModelAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireSession();
  const parsed = modelSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") ?? "",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  const model = await prisma.decisionModel.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description || null,
      status: "DRAFT",
      createdById: user.id,
    },
  });

  await logAudit({
    action: "CREATE",
    entity: "Model",
    summary: `Membuat model "${model.name}".`,
    modelId: model.id,
    userId: user.id,
    userName: user.name,
  });

  revalidatePath("/model-spk");
  redirect(`/model-spk/${model.id}`);
}

export async function duplicateModelAction(formData: FormData): Promise<void> {
  const user = await requireSession();
  const modelId = String(formData.get("modelId") ?? "");
  if (!modelId) return;
  const newModel = await duplicateModel(modelId, user.id);
  await logAudit({
    action: "DUPLICATE",
    entity: "Model",
    summary: `Menduplikat model menjadi "${newModel.name}".`,
    modelId: newModel.id,
    userId: user.id,
    userName: user.name,
  });
  revalidatePath("/model-spk");
  redirect(`/model-spk/${newModel.id}`);
}

export async function publishModelAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireSession();
  const modelId = String(formData.get("modelId") ?? "");
  if (!modelId) return { ok: false, error: "Model tidak ditemukan." };

  try {
    await publishModel(modelId);
  } catch (e) {
    if (e instanceof ModelError) {
      return { ok: false, error: e.message, problems: e.problems };
    }
    throw e;
  }

  await logAudit({
    action: "PUBLISH",
    entity: "Model",
    summary: "Mempublikasikan model menjadi Aktif.",
    modelId,
    userId: user.id,
    userName: user.name,
  });

  revalidatePath("/model-spk");
  revalidatePath(`/model-spk/${modelId}`);
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function archiveModelAction(formData: FormData): Promise<void> {
  const user = await requireSession();
  const modelId = String(formData.get("modelId") ?? "");
  if (!modelId) return;
  await archiveModel(modelId);
  await logAudit({
    action: "ARCHIVE",
    entity: "Model",
    summary: "Mengarsipkan model.",
    modelId,
    userId: user.id,
    userName: user.name,
  });
  revalidatePath("/model-spk");
  revalidatePath(`/model-spk/${modelId}`);
  revalidatePath("/dashboard");
}

export async function restoreModelAction(formData: FormData): Promise<ActionResult> {
  const user = await requireSession();
  const modelId = String(formData.get("modelId") ?? "");
  if (!modelId) return { ok: false, error: "Model tidak ditemukan." };

  try {
    await restoreModel(modelId);
  } catch (e) {
    if (e instanceof ModelError) {
      return { ok: false, error: e.message };
    }
    throw e;
  }

  await logAudit({
    action: "RESTORE",
    entity: "Model",
    summary: "Mengembalikan model dari Arsip menjadi Draf.",
    modelId,
    userId: user.id,
    userName: user.name,
  });

  revalidatePath("/model-spk");
  revalidatePath(`/model-spk/${modelId}`);
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteModelAction(formData: FormData): Promise<ActionResult> {
  const user = await requireSession();
  const modelId = String(formData.get("modelId") ?? "");
  if (!modelId) return { ok: false, error: "Model tidak ditemukan." };

  const model = await prisma.decisionModel.findUnique({
    where: { id: modelId },
    select: { name: true },
  });

  try {
    await deleteModel(modelId);
  } catch (e) {
    if (e instanceof ModelError) {
      return { ok: false, error: e.message };
    }
    throw e;
  }

  await logAudit({
    action: "DELETE",
    entity: "Model",
    summary: `Menghapus model "${model?.name ?? modelId}".`,
    modelId: null,
    userId: user.id,
    userName: user.name,
  });

  revalidatePath("/model-spk");
  revalidatePath("/dashboard");
  return { ok: true };
}
