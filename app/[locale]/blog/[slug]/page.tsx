import Image from "next/image";
import { notFound, permanentRedirect } from "next/navigation";
import { marked } from "marked";
import sanitizeHtml from "sanitize-html";
import { getPosts, demoMode } from "@/lib/catalog";
import { db } from "@/lib/db";
import { metadata, JsonLd, baseUrl } from "@/lib/seo";
import { messages } from "@/lib/messages";
import { resolveImage } from "@/lib/images";
import type { Locale } from "@/lib/config";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { Link } from "@/lib/i18n/navigation";
export const revalidate = 300;
type Props = { params: Promise<{ locale: Locale; slug: string }> };
export async function generateStaticParams() {
  return (await getPosts()).flatMap((p) => [
    { locale: "en", slug: p.slug },
    { locale: "sq", slug: p.slugSq },
  ]);
}
export async function generateMetadata({ params }: Props) {
  const { locale, slug } = await params;
  const p = (await getPosts()).find((p) => p.slug === slug || p.slugSq === slug);
  return p
    ? metadata(
        locale,
        `/blog/${slug}`,
        p.translations[locale].name,
        p.translations[locale].description,
        {
          paths: { sq: `/blog/${p.slugSq}`, en: `/blog/${p.slug}` },
          image: `${baseUrl}/${locale}/blog/${slug}/opengraph-image`,
        },
      )
    : {};
}
export default async function Article({ params }: Props) {
  const { locale, slug } = await params;
  const p = (await getPosts()).find((p) => p.slug === slug || p.slugSq === slug);
  if (!p) {
    if (!demoMode) {
      const old = await db.post.findFirst({ where: { published: true, oldSlugs: { has: slug } } });
      if (old) permanentRedirect(`/${locale}/blog/${locale === "sq" ? old.slugSq : old.slug}`);
    }
    notFound();
  }
  const expected = locale === "sq" ? p.slugSq : p.slug;
  if (slug !== expected) permanentRedirect(`/${locale}/blog/${expected}`);
  const m = messages(locale);
  const tr = p.translations[locale];
  const html = sanitizeHtml(await marked.parse(tr.body || ""));
  return (
    <main id="main" className="container">
      <Breadcrumbs
        locale={locale}
        items={[
          { name: m.blog, path: "/blog" },
          { name: tr.name, path: `/blog/${slug}` },
        ]}
      />
      <article className="prose section" style={{ marginInline: "auto" }}>
        <h1>{tr.name}</h1>
        <p>{tr.description}</p>
        <Image
          src={resolveImage(p.image)}
          alt={tr.name}
          width={800}
          height={480}
          priority
          sizes="(max-width: 800px) 100vw, 800px"
          style={{ width: "100%", height: "auto", borderRadius: 16 }}
        />
        <div dangerouslySetInnerHTML={{ __html: html }} />
        <div className="row wrap" style={{ marginTop: 40 }}>
          <Link className="btn" href="/shop">
            {m.shopNow}
          </Link>
          <Link className="link" href="/blog">
            {m.allGuides}
          </Link>
        </div>
      </article>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: tr.name,
          description: tr.description,
          author: { "@type": "Organization", name: "EchoFoil" },
          publisher: { "@type": "Organization", name: "EchoFoil" },
          mainEntityOfPage: `${baseUrl}/${locale}/blog/${slug}`,
          image: `${baseUrl}${resolveImage(p.image)}`,
        }}
      />
    </main>
  );
}
