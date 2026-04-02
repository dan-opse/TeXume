import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { resumeSessions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sessionPatchSchema } from "@/lib/validators/session.validator";
import { auth } from "@/auth";
import { logger } from "@/lib/logger";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [session] = await db
      .select()
      .from(resumeSessions)
      .where(eq(resumeSessions.id, id))
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

    // Redact raw input before returning
    return NextResponse.json({
      ...session,
      rawInput: undefined,
    });
  } catch (err) {
    logger.error("Session GET error", { error: String(err) });
    return NextResponse.json(
      { error: "Something went wrong on our end. We've been notified." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => null);
    const parsed = sessionPatchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid session update data." },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (parsed.data.latexSource !== undefined) {
      updateData.latexSource = parsed.data.latexSource;
    }
    if (parsed.data.selectedTemplate !== undefined) {
      updateData.selectedTemplate = parsed.data.selectedTemplate;
    }

    await db
      .update(resumeSessions)
      .set(updateData)
      .where(eq(resumeSessions.id, id));

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error("Session PATCH error", { error: String(err) });
    return NextResponse.json(
      { error: "Something went wrong on our end. We've been notified." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const [resumeSession] = await db
      .select()
      .from(resumeSessions)
      .where(eq(resumeSessions.id, id))
      .limit(1);

    if (!resumeSession) {
      return NextResponse.json(
        { error: "Session not found." },
        { status: 404 }
      );
    }

    if (resumeSession.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden: You don't have permission to delete this session." },
        { status: 403 }
      );
    }

    await db.delete(resumeSessions).where(eq(resumeSessions.id, id));

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error("Session DELETE error", { error: String(err) });
    return NextResponse.json(
      { error: "Failed to delete session." },
      { status: 500 }
    );
  }
}
