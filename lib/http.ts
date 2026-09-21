import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { rateLimit } from "./ratelimit";
export async function protectRequest(req: Request, action: string) {
  const origin = req.headers.get("origin");
  const expected = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;
  if (origin && new URL(origin).origin !== new URL(expected).origin) throw new Error("FORBIDDEN");
  if (Number(req.headers.get("content-length") || 0) > 2_000_000)
    throw new Error("INVALID_REQUEST");
  await rateLimit(
    `${action}:${req.headers.get("x-real-ip") || req.headers.get("x-forwarded-for")?.split(",")[0] || "local"}`,
  );
  if (!process.env.DATABASE_URL) throw new Error("SERVICE_UNAVAILABLE");
}
export function apiError(error: unknown) {
  const code =
    error instanceof ZodError
      ? "INVALID_REQUEST"
      : error instanceof Error
        ? error.message
        : "SERVER_ERROR";
  const statuses: Record<string, number> = {
    INVALID_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    RATE_LIMIT: 429,
    RATE_LIMIT_UNCONFIGURED: 503,
    SERVICE_UNAVAILABLE: 503,
    BANK_UNAVAILABLE: 409,
    OUT_OF_STOCK: 409,
    NOT_FOUND: 404,
    HUMAN_VERIFICATION: 400,
    EMAIL_UNAVAILABLE: 503,
    INVALID_TOKEN: 400,
    EMAIL_EXISTS: 409,
    INVALID_PASSWORD: 400,
  };
  if (!statuses[code]) console.error("API error", error instanceof Error ? error.name : "Unknown");
  return NextResponse.json(
    { error: statuses[code] ? code : "SERVER_ERROR" },
    { status: statuses[code] ?? 500 },
  );
}
