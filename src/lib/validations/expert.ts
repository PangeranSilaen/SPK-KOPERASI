import { z } from "zod";

export const expertSchema = z.object({
  name: z.string().trim().min(1, "Nama expert wajib diisi.").max(120),
  position: z.string().trim().max(150).optional().or(z.literal("")),
  experience: z.string().trim().max(60).optional().or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
  isEnabled: z.boolean().default(true),
});

export type ExpertInput = z.infer<typeof expertSchema>;
