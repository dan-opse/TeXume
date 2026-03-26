import { db } from "@/db";
import { usageLedger, resumeSessions, users } from "@/db/schema";
import { and, eq, gte, count } from "drizzle-orm";
import type { ActionType, QuotaStatus } from "@/lib/types";
import { logger } from "@/lib/logger";

const ABUSE_LIMITS: Record<ActionType, number> = {
  generate: 100,
  export_pdf: 100,
  export_zip: 100,
};

function rollingWindowStart(): Date {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d;
}

/**
 * Record a usage action for a user or anonymous session.
 */
export async function recordAction(params: {
  action: ActionType;
  userId?: string;
  sessionId?: string;
}): Promise<void> {
  try {
    await db.insert(usageLedger).values({
      action: params.action,
      userId: params.userId ?? null,
      sessionId: params.sessionId ?? null,
    });
  } catch (err) {
    logger.error("Failed to record usage action", {
      action: params.action,
      sessionId: params.sessionId,
      error: String(err),
    });
  }
}

/**
 * Get the remaining quota for a given action.
 */
export async function getQuotaStatus(params: {
  action: ActionType;
  userId?: string;
  sessionId?: string;
}): Promise<QuotaStatus> {
  const limit = ABUSE_LIMITS[params.action];

  if (limit === Infinity) {
    return {
      action: params.action,
      used: 0,
      limit: Infinity,
      remaining: Infinity,
      isAtLimit: false,
    };
  }

  const windowStart = rollingWindowStart();

  try {
    const conditions = [
      eq(usageLedger.action, params.action),
      gte(usageLedger.createdAt, windowStart),
    ];

    if (params.userId) {
      conditions.push(eq(usageLedger.userId, params.userId));
    } else if (params.sessionId) {
      conditions.push(eq(usageLedger.sessionId, params.sessionId));
    }

    const [result] = await db
      .select({ count: count() })
      .from(usageLedger)
      .where(and(...conditions));

    const used = result?.count ?? 0;
    const remaining = Math.max(0, limit - used);

    return {
      action: params.action,
      used,
      limit,
      remaining,
      isAtLimit: used >= limit,
    };
  } catch (err) {
    logger.error("Failed to get quota status", { error: String(err) });
    // Fail open — allow the action
    return {
      action: params.action,
      used: 0,
      limit,
      remaining: limit,
      isAtLimit: false,
    };
  }
}


