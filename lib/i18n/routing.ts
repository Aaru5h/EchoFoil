import { defineRouting } from "next-intl/routing";
import { locales, defaultLocale } from "@/lib/config";

/**
 * Locale-prefixed routes for every locale, including the default. Keeping the
 * prefix on `sq` too means one canonical shape per page and no ambiguity for
 * hreflang - `/` simply redirects to `/sq`.
 */
export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: "always",
  localeDetection: true,
});
