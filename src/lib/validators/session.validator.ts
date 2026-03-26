import { z } from "zod";

export const sessionPatchSchema = z.object({
  latexSource: z.string().optional(),
  selectedTemplate: z.enum(["classic", "modern", "minimal"]).optional(),
});

export type SessionPatchInput = z.infer<typeof sessionPatchSchema>;
