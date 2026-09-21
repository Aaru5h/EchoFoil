import type { Metadata } from "next";
import type { Locale } from "./config";
export const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
export function metadata(
  locale: Locale,
  path: string,
  title: string,
  description: string,
  options: { private?: boolean; paths?: { sq: string; en: string }; image?: string } = {},
): Metadata {
  const paths = options.paths ?? { sq: path, en: path };
  return {
    title,
    description,
    alternates: {
      canonical: `${baseUrl}/${locale}${paths[locale]}`,
      languages: {
        sq: `${baseUrl}/sq${paths.sq}`,
        en: `${baseUrl}/en${paths.en}`,
        "x-default": `${baseUrl}/sq${paths.sq}`,
      },
    },
    openGraph: {
      title,
      description,
      type: "website",
      locale: locale === "sq" ? "sq_AL" : "en_GB",
      url: `${baseUrl}/${locale}${paths[locale]}`,
      siteName: "EchoFoil",
      images: [options.image ?? `${baseUrl}/opengraph-image`],
    },
    twitter: { card: "summary_large_image", title, description },
    ...(options.private ? { robots: { index: false, follow: false } } : {}),
  };
}
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
