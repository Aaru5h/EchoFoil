import { notFound, permanentRedirect } from "next/navigation";
import { getProducts, demoMode } from "@/lib/catalog";
import { db } from "@/lib/db";
import { messages } from "@/lib/messages";
import { metadata, JsonLd, baseUrl } from "@/lib/seo";
import { resolveImage } from "@/lib/images";
import type { Locale } from "@/lib/config";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import {
  ProductPurchase,
  Gallery,
  ProductCard,
  RecentlyViewed,
} from "@/components/product/products";
import { SimpleForm } from "@/components/forms/simple-form";
import { currentUser } from "@/lib/auth/guards";
import { Link } from "@/lib/i18n/navigation";
export const revalidate = 300;
type Props = { params: Promise<{ locale: Locale; slug: string }> };
export async function generateStaticParams() {
  const products = await getProducts();
  return products.flatMap((p) => [
    { locale: "en", slug: p.slug },
    { locale: "sq", slug: p.slugSq },
  ]);
}
export async function generateMetadata({ params }: Props) {
  const { locale, slug } = await params;
  const p = (await getProducts()).find((p) => p.slug === slug || p.slugSq === slug);
  if (!p) return {};
  const tr = p.translations[locale];
  return metadata(
    locale,
    `/product/${slug}`,
    tr.seoTitle || tr.name,
    tr.seoDescription ||
      `${tr.name}. ${p.variants[0]?.width} cm, ${p.variants[0]?.length} m. ${messages(locale).delivery}`,
    {
      paths: { sq: `/product/${p.slugSq}`, en: `/product/${p.slug}` },
      image: `${baseUrl}/${locale}/product/${slug}/opengraph-image`,
    },
  );
}
export default async function Product({ params }: Props) {
  const { locale, slug } = await params;
  const products = await getProducts();
  const p = products.find((p) => p.slug === slug || p.slugSq === slug);
  if (!p) {
    if (!demoMode) {
      const old = await db.product.findFirst({
        where: { published: true, oldSlugs: { has: slug } },
      });
      if (old) permanentRedirect(`/${locale}/product/${locale === "sq" ? old.slugSq : old.slug}`);
    }
    notFound();
  }
  const expected = locale === "sq" ? p.slugSq : p.slug;
  console.log("[PROBE]", JSON.stringify({locale, slug, expected, willRedirect: slug !== expected}));
  if (slug !== expected) permanentRedirect(`/${locale}/product/${expected}`);
  console.log("[PROBE-AFTER] execution continued past redirect");
  const m = messages(locale);
  const tr = p.translations[locale];
  const reviews = demoMode
    ? []
    : await db.review.findMany({
        where: { productId: p.id, approved: true },
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      });
  const user = demoMode ? null : await currentUser();
  const v = p.variants[0];
  return (
    <main id="main" className="container product-page">
      <Breadcrumbs
        locale={locale}
        items={[
          { name: m.shop, path: "/shop" },
          { name: tr.name, path: `/product/${expected}` },
        ]}
      />
      <section className="product-detail">
        <Gallery product={p} />
        <div>
          <h1>{tr.name}</h1>
          <p className="muted">{tr.description}</p>
          <ProductPurchase product={p} />
        </div>
      </section>
      <section className="grid2 section">
        <div>
          {[
            { title: m.details, body: tr.description },
            { title: m.usage, body: m.usageText },
            { title: m["shipping-returns"], body: m.deliveryText },
          ].map((a, i) => (
            <details className="faq-item" open={i === 0} key={a.title}>
              <summary>{a.title}</summary>
              <p>{a.body}</p>
            </details>
          ))}
          <details className="faq-item">
            <summary>{m.specifications}</summary>
            <table className="table">
              <tbody>
                {[
                  [m.width, v?.width],
                  [m.length, v?.length],
                  [m.thickness, v?.thicknessMicrons],
                  [m.sku, v?.sku],
                ].map(([k, value]) => (
                  <tr key={k}>
                    <th>{k}</th>
                    <td>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </div>
        <div>
          <h2>{m.reviews}</h2>
          {reviews.length ? (
            <>
              <p>
                {(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)} / 5 ·{" "}
                {reviews.length}
              </p>
              {reviews.map((r) => (
                <article
                  key={r.id}
                  style={{ borderBottom: "1px solid var(--line)", padding: "20px 0" }}
                >
                  <strong>{r.user.name}</strong>
                  <span className="badge" style={{ marginLeft: 16 }}>
                    {r.rating} / 5
                  </span>
                  <p className="muted" style={{ marginTop: 12 }}>
                    {r.body}
                  </p>
                </article>
              ))}
            </>
          ) : (
            <p className="muted">{m.noReviews}</p>
          )}
          {user ? (
            <SimpleForm kind="review" extra={{ productId: p.id }} />
          ) : (
            <Link href="/login" className="link">
              {m.login} · {m.writeReview}
            </Link>
          )}
        </div>
      </section>
      <section className="section" style={{ paddingTop: 0 }}>
        <h2>{m.related}</h2>
        <div className="grid4">
          {products
            .filter((x) => x.id !== p.id && x.categoryId === p.categoryId)
            .slice(0, 4)
            .map((p) => (
              <ProductCard product={p} key={p.id} />
            ))}
        </div>
      </section>
      <RecentlyViewed current={p.id} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: tr.name,
          description: tr.description,
          image: p.images.map((i) => `${baseUrl}${resolveImage(i.src)}`),
          sku: v?.sku,
          brand: { "@type": "Brand", name: "EchoFoil" },
          offers: p.variants.map((v) => ({
            "@type": "Offer",
            price: v.price,
            priceCurrency: "EUR",
            availability: `https://schema.org/${v.stock ? "InStock" : "OutOfStock"}`,
            url: `${baseUrl}/${locale}/product/${expected}`,
          })),
          ...(reviews.length
            ? {
                aggregateRating: {
                  "@type": "AggregateRating",
                  ratingValue: reviews.reduce((s, r) => s + r.rating, 0) / reviews.length,
                  reviewCount: reviews.length,
                },
              }
            : {}),
        }}
      />
    </main>
  );
}
