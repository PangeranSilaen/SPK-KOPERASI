"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { modelSchema } from "@/lib/validations/model";
import {
  ModelError,
  archiveModel,
  duplicateModel,
  publishModel,
} from "@/server/services/model-service";

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

  revalidatePath("/model-spk");
  redirect(`/model-spk/${model.id}`);
}

export async function duplicateModelAction(formData: FormData): Promise<void> {
  const user = await requireSession();
  const modelId = String(formData.get("modelId") ?? "");
  if (!modelId) return;
  const newModel = await duplicateModel(modelId, user.id);
  revalidatePath("/model-spk");
  redirect(`/model-spk/${newModel.id}`);
}

export async function publishModelAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  await requireSession();
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

  revalidatePath("/model-spk");
  revalidatePath(`/model-spk/${modelId}`);
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function archiveModelAction(formData: FormData): Promise<void> {
  await requireSession();
  const modelId = String(formData.get("modelId") ?? "");
  if (!modelId) return;
  await archiveModel(modelId);
  revalidatePath("/model-spk");
  revalidatePath(`/model-spk/${modelId}`);
  revalidatePath("/dashboard");
}
