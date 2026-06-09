import { z } from "zod";

export const strategyScoreSchema = z.object({
  conditionId: z.string().min(1),
  alternativeId: z.string().min(1),
  criterionId: z.string().min(1),
  value: z.coerce.number().int().min(1, "Nilai minimal 1.").max(5, "Nilai maksimal 5."),
});

export const saveStrategySchema = z.object({
  modelId: z.string().min(1),
  expertId: z.string().min(1),
  conditionId: z.string().min(1),
  scores: z.array(strategyScoreSchema).min(1, "Belum ada nilai untuk disimpan."),
});

export type StrategyScoreInput = z.infer<typeof strategyScoreSchema>;
export type SaveStrategyInput = z.infer<typeof saveStrategySchema>;
