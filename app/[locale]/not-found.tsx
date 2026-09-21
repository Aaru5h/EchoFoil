import { getLocale } from "next-intl/server";
import { messages } from "@/lib/messages";
import type { Locale } from "@/lib/config";
import { Link } from "@/lib/i18n/navigation";
export default async function NotFound() {
  const m = messages((await getLocale()) as Locale);
  return (
    <main id="main" className="container section">
      <h1>{m.notFoundTitle}</h1>
      <p className="muted">{m.notFoundText}</p>
      <Link className="btn" href="/">
        {m.backHome}
      </Link>
    </main>
  );
}
