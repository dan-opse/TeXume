import { z } from "zod";

export const explainSchema = z.object({
  line: z.string().min(1).max(2000),
  context: z.string().max(500).optional(),
});

export type ExplainInput = z.infer<typeof explainSchema>;
