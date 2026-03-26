import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { resumeSessions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { compile, CompileError } from "@/lib/compiler";
import { checkRateLimit, compileRatelimit } from "@/lib/ratelimit";
import { logger } from "@/lib/logger";
import type { ParsedResume } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    // Rate limit by session
    const body = await request.json().catch(() => null);
    const sessionId: string | undefined = body?.sessionId;
    const latexOverride: string | undefined = body?.latex;

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required." },
        { status: 400 }
      );
    }

    const { success } = await checkRateLimit(compileRatelimit, sessionId);
    if (!success) {
      return NextResponse.json(
        { error: "Too many compile requests. Please wait a moment." },
        { status: 429 }
      );
    }

    // Fetch session
    const [session] = await db
      .select()
      .from(resumeSessions)
      .where(eq(resumeSessions.id, sessionId))
      .limit(1);

    if (!session) {
      return NextResponse.json(
        {
          error:
            "We couldn't find that session — it may have expired. Start a new resume.",
        },
        { status: 404 }
      );
    }

    const latex = latexOverride ?? session.latexSource;
    if (!latex) {
      return NextResponse.json(
        { error: "No LaTeX source found for this session." },
        { status: 400 }
      );
    }

    // If latex was overridden, save it to session
    if (latexOverride) {
      await db
        .update(resumeSessions)
        .set({ latexSource: latexOverride, updatedAt: new Date() })
        .where(eq(resumeSessions.id, sessionId));
    }

    // Compile via Tectonic
    const pdfBuffer = await compile(latex);

    // Return PDF as base64 data URL for preview
    const base64 = pdfBuffer.toString("base64");
    const pdfDataUrl = `data:application/pdf;base64,${base64}`;

    return NextResponse.json({ pdfUrl: pdfDataUrl, sessionId });
  } catch (err) {
    if (err instanceof CompileError) {
      return NextResponse.json(
        {
          error: err.message,
          code: "COMPILE_ERROR",
          lineNumber: err.lineNumber,
        },
        { status: 422 }
      );
    }

    // Network error (Tectonic sidecar unreachable)
    if (err instanceof TypeError && String(err).includes("fetch")) {
      return NextResponse.json(
        {
          error:
            "Couldn't reach the compilation server — check your connection and try again.",
          code: "COMPILE_UNAVAILABLE",
        },
        { status: 503 }
      );
    }

    logger.error("Compile endpoint error", { error: String(err) });
    return NextResponse.json(
      { error: "Something went wrong on our end. We've been notified." },
      { status: 500 }
    );
  }
}
