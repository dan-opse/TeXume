import { NextRequest, NextResponse } from "next/server";
import { getQuotaStatus } from "@/lib/usage";
import { auth } from "@/auth";
import type { ActionType } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId") ?? undefined;
    const actions: ActionType[] = ["generate", "export_pdf", "export_zip"];

    const userId = session?.user?.id;

    const quotas = await Promise.all(
      actions.map((action) =>
        getQuotaStatus({ action, userId, sessionId })
      )
    );

    return NextResponse.json({ quotas });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch quota." },
      { status: 500 }
    );
  }
}
