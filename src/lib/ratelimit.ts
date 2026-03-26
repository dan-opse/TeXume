import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return null;
  }

  return new Redis({ url, token });
}

// 5 requests per 60 seconds per IP (for /api/convert)
export const convertRatelimit = new Ratelimit({
  redis: getRedis() as Redis,
  limiter: Ratelimit.slidingWindow(5, "60 s"),
  prefix: "texume:convert",
  analytics: false,
});

// 10 requests per 60 seconds per session (for /api/compile)
export const compileRatelimit = new Ratelimit({
  redis: getRedis() as Redis,
  limiter: Ratelimit.slidingWindow(10, "60 s"),
  prefix: "texume:compile",
  analytics: false,
});

// 10 requests per hour per IP (for auth endpoints)
export const authRatelimit = new Ratelimit({
  redis: getRedis() as Redis,
  limiter: Ratelimit.slidingWindow(10, "3600 s"),
  prefix: "texume:auth",
  analytics: false,
});

// Generic ratelimit helper
export const explainRatelimit = new Ratelimit({
  redis: getRedis() as Redis,
  limiter: Ratelimit.slidingWindow(30, "60 s"),
  prefix: "texume:explain",
  analytics: false,
});

export async function checkRateLimit(
  ratelimit: Ratelimit,
  identifier: string
): Promise<{ success: boolean; remaining: number; reset: number }> {
  try {
    const result = await ratelimit.limit(identifier);
    return {
      success: result.success,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch {
    // If Redis is unavailable, allow the request (fail open)
    return { success: true, remaining: 9, reset: Date.now() + 60000 };
  }
}
