import { z } from "zod";

export const ahpComparisonSchema = z
  .object({
    leftCriterionId: z.string().min(1),
    rightCriterionId: z.string().min(1),
    preference: z.enum(["LEFT", "RIGHT", "EQUAL"], {
      message: "Preferensi harus LEFT, RIGHT, atau EQUAL.",
    }),
    scale: z.coerce.number().int().min(1).max(9),
  })
  .refine((v) => v.preference !== "EQUAL" || v.scale === 1, {
    message: "Jika sama penting, intensitas harus 1.",
    path: ["scale"],
  });

export const saveAhpSchema = z.object({
  modelId: z.string().min(1),
  expertId: z.string().min(1),
  comparisons: z.array(ahpComparisonSchema).min(1, "Belum ada perbandingan untuk disimpan."),
});

export type AhpComparisonInput = z.infer<typeof ahpComparisonSchema>;
export type SaveAhpInput = z.infer<typeof saveAhpSchema>;

/**
 * Konversi preferensi + intensitas menjadi nilai rasio matriks (kiri terhadap kanan).
 * LEFT n  -> kiri lebih penting n kali -> ratio = n
 * RIGHT n -> kanan lebih penting n kali -> ratio = 1/n
 * EQUAL   -> ratio = 1
 */
export function preferenceToRatio(
  preference: "LEFT" | "RIGHT" | "EQUAL",
  scale: number,
): number {
  if (preference === "EQUAL") return 1;
  if (preference === "RIGHT") return 1 / scale;
  return scale;
}
