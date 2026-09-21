import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";
import type { Locale } from "@/lib/config";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = (
    routing.locales.includes(requested as Locale) ? requested : routing.defaultLocale
  ) as Locale;

  return {
    locale,
    messages: Object.fromEntries(
      Object.entries((await import(`../../messages/${locale}.json`)).default).filter(
        (entry): entry is [string, string] => typeof entry[1] === "string",
      ),
    ),
    timeZone: "Europe/Tirane",
    now: new Date(),
  };
});
