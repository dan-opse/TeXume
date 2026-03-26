import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { resumeSessions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateSchema } from "@/lib/validators/generate.validator";
import { generateLatex } from "@/lib/templates";
import { getProModel } from "@/lib/gemini";
import { getQuotaStatus, recordAction } from "@/lib/usage";
import { auth } from "@/auth";
import { logger } from "@/lib/logger";
import type { ParsedResume, TemplateSlug } from "@/lib/types";

const GENERATE_PROMPT = (
  parsed: ParsedResume,
  template: TemplateSlug
): string => `You are an expert LaTeX resume writer. 

I have parsed resume data and a LaTeX template. Improve and enhance the LaTeX content by:
1. Strengthening bullet points with specific metrics and impact
2. Ensuring consistent formatting within the template style
3. Making descriptions more professional and achievement-oriented

Template: ${template}
Parsed Resume Data (JSON):
${JSON.stringify(parsed, null, 2)}

Return ONLY the complete, compilable LaTeX document source. No explanation, no markdown fences.`;

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const body = await request.json().catch(() => null);
    const parsed = generateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request parameters." },
        { status: 400 }
      );
    }

    const { sessionId, templateSlug } = parsed.data;

    // Fetch the resume session
    const [resumeSession] = await db
      .select()
      .from(resumeSessions)
      .where(eq(resumeSessions.id, sessionId))
      .limit(1);

    if (!resumeSession) {
      return NextResponse.json(
        {
          error:
            "We couldn't find that session — it may have expired. Start a new resume.",
        },
        { status: 404 }
      );
    }

    // Check quota
    const userId = session?.user?.id;
    const quota = await getQuotaStatus({
      action: "generate",
      userId,
      sessionId,
    });

    if (quota.isAtLimit) {
      return NextResponse.json(
        {
          error:
            "You've reached the abuse limit for generation. Please try again next month.",
          code: "QUOTA_EXCEEDED",
          quota,
        },
        { status: 403 }
      );
    }

    const parsedResume = resumeSession.parsedResume as unknown as ParsedResume;

    // Generate LaTeX using template renderer
    let latex = await generateLatex(parsedResume, templateSlug);

    // Optionally enhance with Gemini Pro for quality
    try {
      const model = getProModel();
      const result = await model.generateContent(
        GENERATE_PROMPT(parsedResume, templateSlug)
      );
      const enhanced = result.response.text().trim();
      if (enhanced && enhanced.includes("\\documentclass")) {
        latex = enhanced;
      }
    } catch (geminiErr) {
      logger.warn("Gemini enhancement failed, using template fallback", {
        error: String(geminiErr),
      });
      // Keep the template-generated LaTeX as fallback
    }

    // Update the session
    await db
      .update(resumeSessions)
      .set({
        selectedTemplate: templateSlug,
        latexSource: latex,
        updatedAt: new Date(),
      })
      .where(eq(resumeSessions.id, sessionId));

    // Record usage
    await recordAction({ action: "generate", userId, sessionId });

    return NextResponse.json({ latex, sessionId });
  } catch (err) {
    logger.error("Generate endpoint error", { error: String(err) });
    return NextResponse.json(
      { error: "Something went wrong on our end. We've been notified." },
      { status: 500 }
    );
  }
}
