import { z } from "zod";

export const convertTextSchema = z.object({
  text: z.string().min(50, "Resume text is too short").max(50_000),
});

export const convertFileSchema = z.object({
  filename: z.string(),
  mimeType: z.enum([
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
  ]),
  size: z.number().max(5 * 1024 * 1024, "File must be under 5 MB"),
});

export type ConvertTextInput = z.infer<typeof convertTextSchema>;
