"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { parseWorkbook, ParseError } from "@/lib/import/xlsx-parser";
import { validateParsedWorkbook } from "@/lib/import/import-validator";
import { createModelFromImport } from "@/lib/import/import-service";
import { modelSchema } from "@/lib/validations/model";

export type ConfirmImportResult = { ok: boolean; error?: string; problems?: string[] };

export async function confirmImportAction(
  _prev: ConfirmImportResult,
  formData: FormData,
): Promise<ConfirmImportResult> {
  const user = await requireSession();

  const nameParsed = modelSchema.safeParse({
    name: formData.get("modelName"),
    description: "",
  });
  if (!nameParsed.success) {
    return { ok: false, error: "Nama Model SPK wajib diisi." };
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return { ok: false, error: "File tidak ditemukan. Silakan unggah ulang." };
  }
  if (!file.name.toLowerCase().endsWith(".xlsx")) {
    return {
      ok: false,
      error: "Format file tidak sesuai. Pastikan file berformat XLSX.",
    };
  }

  let modelId: string;
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const parsed = parseWorkbook(buffer);
    const validation = validateParsedWorkbook(parsed);
    if (validation.errors.length > 0) {
      return {
        ok: false,
        error: "File belum dapat diimport karena terdapat data yang belum lengkap:",
        problems: validation.errors.slice(0, 20),
      };
    }
    modelId = await createModelFromImport(parsed, nameParsed.data.name, user.id);
  } catch (e) {
    if (e instanceof ParseError) {
      return { ok: false, error: e.message };
    }
    return { ok: false, error: "Gagal mengimport file. Pastikan file XLSX tidak rusak." };
  }

  revalidatePath("/model-spk");
  revalidatePath("/dashboard");
  redirect(`/model-spk/${modelId}`);
}
