import { z } from "zod";

const codeSchema = z
  .string()
  .trim()
  .min(1, "Kode wajib diisi.")
  .max(20)
  .regex(/^[A-Za-z0-9_-]+$/, "Kode hanya boleh huruf, angka, - dan _.");

export const criterionSchema = z.object({
  code: codeSchema,
  name: z.string().trim().min(1, "Nama kriteria wajib diisi.").max(120),
  type: z.enum(["BENEFIT", "COST"], {
    message: "Jenis kriteria harus benefit atau cost.",
  }),
  order: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const alternativeSchema = z.object({
  code: codeSchema,
  name: z.string().trim().min(1, "Nama alternatif wajib diisi.").max(120),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  order: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const conditionSchema = z.object({
  code: codeSchema,
  name: z.string().trim().min(1, "Nama kondisi wajib diisi.").max(120),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  order: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export type CriterionInput = z.infer<typeof criterionSchema>;
export type AlternativeInput = z.infer<typeof alternativeSchema>;
export type ConditionInput = z.infer<typeof conditionSchema>;
