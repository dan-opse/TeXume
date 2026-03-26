import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { resumeSessions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { compile } from "@/lib/compiler";
import { getQuotaStatus, recordAction } from "@/lib/usage";
import { auth } from "@/auth";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required." },
        { status: 400 }
      );
    }

    // Fetch resume session
    const [resumeSession] = await db
      .select()
      .from(resumeSessions)
      .where(eq(resumeSessions.id, sessionId))
      .limit(1);

    if (!resumeSession || !resumeSession.latexSource) {
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
    const plan = "free";
    const quota = await getQuotaStatus({
      action: "export_pdf",
      userId,
      sessionId,
    });

    if (quota.isAtLimit) {
      return NextResponse.json(
        {
          error:
            "You've reached the abuse limit for PDF downloads. Please try again next month.",
          code: "QUOTA_EXCEEDED",
          quota,
        },
        { status: 403 }
      );
    }

    // Compile to PDF
    const pdfBuffer = await compile(resumeSession.latexSource);

    // Record usage
    await recordAction({ action: "export_pdf", userId, sessionId });

    // Stream PDF
    return new Response(pdfBuffer.buffer as ArrayBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="resume.pdf"',
        "Content-Length": String(pdfBuffer.byteLength),
      },
    });
  } catch (err) {
    logger.error("PDF export error", { error: String(err) });
    return NextResponse.json(
      { error: "Something went wrong on our end. We've been notified." },
      { status: 500 }
    );
  }
}
