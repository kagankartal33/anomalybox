import { z } from "zod";

export const goldRatingInputSchema = z.object({
  ideaId: z.string().uuid(),
  decision: z.enum(["approve", "refine", "reject"]),
  rank: z.coerce.number().int().min(1).max(5),
  runtimeFit: z.enum(["rushed", "right", "padded"]),
  failureCodes: z.array(z.string().regex(/^[a-z0-9_]{2,64}$/)).max(16),
  notes: z.string().trim().max(1000),
});

export type GoldRatingInput = z.infer<typeof goldRatingInputSchema>;