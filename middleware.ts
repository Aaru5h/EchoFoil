import createIntlMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "@/lib/i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

/**
 * Two jobs: locale negotiation for public routes, and a cheap cookie-presence
 * gate for private ones.
 *
 * The gate here is a redirect convenience only - it checks that *a* session
 * cookie exists, never who owns it. Real authorisation (session validity and
 * role) is re-checked inside every protected page, server action and route
 * handler via lib/auth/guards.ts. Middleware runs on the edge without DB
 * access, so it cannot be the security boundary.
 */
const PROTECTED = /^\/(sq|en)\/account(\/|$)/;
const ADMIN = /^\/admin(\/|$)/;

function hasSessionCookie(req: NextRequest): boolean {
  return (
    req.cookies.has("authjs.session-token") || req.cookies.has("__Secure-authjs.session-token")
  );
}

export default function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  if (ADMIN.test(pathname)) {
    if (!hasSessionCookie(req)) {
      const url = new URL(`/sq/login`, req.url);
      url.searchParams.set("callbackUrl", pathname + search);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (PROTECTED.test(pathname) && !hasSessionCookie(req)) {
    const locale = pathname.split("/")[1] ?? routing.defaultLocale;
    const url = new URL(`/${locale}/login`, req.url);
    url.searchParams.set("callbackUrl", pathname + search);
    return NextResponse.redirect(url);
  }

  return intlMiddleware(req);
}

export const config = {
  matcher: [
    // Everything except Next internals, API routes and files with an extension.
    "/((?!api|_next|_vercel|.*\\..*).*)",
  ],
};
