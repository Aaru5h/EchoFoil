import { Link } from "@/lib/i18n/navigation";
import { JsonLd, baseUrl } from "@/lib/seo";
import { messages } from "@/lib/messages";
import type { Locale } from "@/lib/config";
export function Breadcrumbs({
  locale,
  items,
}: {
  locale: Locale;
  items: { name: string; path: string }[];
}) {
  const rows = [{ name: messages(locale).home, path: "" }, ...items];
  return (
    <>
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        {rows.map((item, i) => (
          <span key={i}>
            {i > 0 && (
              <span aria-hidden="true" style={{ marginRight: 9 }}>
                /
              </span>
            )}
            {i === rows.length - 1 ? (
              <span aria-current="page">{item.name}</span>
            ) : (
              <Link href={item.path || "/"}>{item.name}</Link>
            )}
          </span>
        ))}
      </nav>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: rows.map((r, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: r.name,
            item: `${baseUrl}/${locale}${r.path}`,
          })),
        }}
      />
    </>
  );
}
