import { z } from "zod";

export const modelSchema = z.object({
  name: z.string().trim().min(1, "Nama model wajib diisi.").max(120),
  description: z.string().trim().max(500).optional().or(z.literal("")),
});

export type ModelInput = z.infer<typeof modelSchema>;
