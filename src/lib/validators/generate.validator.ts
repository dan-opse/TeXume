import { z } from "zod";

export const generateSchema = z.object({
  sessionId: z.string().uuid(),
  templateSlug: z.enum(["classic", "modern", "minimal"]),
});

export type GenerateInput = z.infer<typeof generateSchema>;
