import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Providers } from "@/components/layout/providers";
import { Shell, Footer } from "@/components/layout/shell";
import { getProducts, getCategories, getSettings, demoMode } from "@/lib/catalog";
import { JsonLd, baseUrl } from "@/lib/seo";
import type { Locale } from "@/lib/config";
export function generateStaticParams() {
  return [{ locale: "sq" }, { locale: "en" }];
}
export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (locale !== "sq" && locale !== "en") notFound();
  setRequestLocale(locale);
  const [messages, products, categories, settings] = await Promise.all([
    getMessages(),
    getProducts(),
    getCategories(),
    getSettings(),
  ]);
  return (
    <NextIntlClientProvider locale={locale as Locale} messages={messages}>
      <Providers products={products}>
        <Shell categories={categories} settings={settings} preview={demoMode} />
        {children}
        <Footer settings={settings} />
        <JsonLd
          data={[
            {
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "EchoFoil",
              url: baseUrl,
            },
            {
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "EchoFoil",
              url: `${baseUrl}/${locale}`,
              potentialAction: {
                "@type": "SearchAction",
                target: `${baseUrl}/${locale}/shop?q={search_term_string}`,
                "query-input": "required name=search_term_string",
              },
            },
          ]}
        />
      </Providers>
    </NextIntlClientProvider>
  );
}
