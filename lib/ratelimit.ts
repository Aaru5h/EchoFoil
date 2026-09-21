import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
const local = new Map<string, { count: number; reset: number }>();
const remote =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Ratelimit({
        redis: new Redis({
          url: process.env.UPSTASH_REDIS_REST_URL,
          token: process.env.UPSTASH_REDIS_REST_TOKEN,
        }),
        limiter: Ratelimit.slidingWindow(10, "10 m"),
        prefix: "echofoil",
      })
    : null;
export async function rateLimit(key: string, limit = 10, windowMs = 600_000) {
  if (remote) {
    const result = await remote.limit(key);
    if (!result.success) throw new Error("RATE_LIMIT");
    return;
  }
  if (process.env.NODE_ENV === "production" && process.env.DATABASE_URL)
    throw new Error("RATE_LIMIT_UNCONFIGURED");
  const now = Date.now();
  for (const [k, v] of local) if (v.reset < now) local.delete(k);
  const item = local.get(key) ?? { count: 0, reset: now + windowMs };
  item.count++;
  local.set(key, item);
  if (item.count > limit) throw new Error("RATE_LIMIT");
}
