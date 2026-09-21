import Image from "next/image";
import {
  ArrowUpRight,
  ArrowRight,
  Truck,
  Layers,
  MoveHorizontal,
  Package,
  MessageCircle,
} from "lucide-react";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/lib/i18n/navigation";
import { getProducts, getCategories, getPosts } from "@/lib/catalog";
import { messages } from "@/lib/messages";
import { metadata } from "@/lib/seo";
import type { Locale } from "@/lib/config";
import { resolveImage, productPlaceholders } from "@/lib/images";
import { ProductCard, FoilHelper } from "@/components/product/products";
import { Newsletter } from "@/components/layout/shell";
export const revalidate = 300;
export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const m = messages(locale);
  return metadata(locale, "", m.heroTitle, m.heroText);
}
export default async function Home({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const m = messages(locale);
  const [products, categories, posts] = await Promise.all([
    getProducts(),
    getCategories(),
    getPosts(),
  ]);
  return (
    <main id="main">
      <div className="container">
        <section className="hero">
          <div>
            <h1>{m.heroTitle}</h1>
            <p>{m.heroText}</p>
            <div className="hero-actions">
              <Link className="btn" href="/shop">
                {m.shopNow}
                <ArrowRight size={18} />
              </Link>
              <Link className="btn secondary" href="/wholesale">
                {m.requestQuote}
              </Link>
            </div>
          </div>
          <div className="hero-stage">
            <Image
              src={productPlaceholders.household.src}
              alt={m.images.householdRoll}
              width={640}
              height={640}
              priority
              sizes="(max-width: 600px) 85vw, 45vw"
            />
            <span className="hero-caption">{m.heroCaption}</span>
          </div>
        </section>
        <div className="trust-row">
          <span>
            <Truck size={19} />
            {m.delivery}
          </span>
          <span>
            <Layers size={19} />
            {m.bulk}
          </span>
          <span>
            <Package size={19} />
            {m.paymentTrust}
          </span>
        </div>
        <section className="section">
          <div className="section-head">
            <h2>{m.categoriesTitle}</h2>
            <Link className="link row" href="/shop">
              {m.viewAll}
              <ArrowUpRight size={17} />
            </Link>
          </div>
          <div className="grid4">
            {categories.map((c) => (
              <Link href={`/shop/${locale === "sq" ? c.slugSq : c.slug}`} className="category-card" key={c.id}>
                <div className="image-stage">
                  <Image
                    src={resolveImage(c.image)}
                    alt={c.translations[locale].name}
                    width={400}
                    height={400}
                    sizes="(max-width: 800px) 45vw, 25vw"
                  />
                </div>
                <h3>
                  {c.translations[locale].name}
                  <ArrowUpRight size={18} />
                </h3>
                <p className="small muted">{c.translations[locale].description}</p>
              </Link>
            ))}
          </div>
        </section>
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="section-head">
            <h2>{m.featuredTitle}</h2>
            <Link href="/shop" className="link">
              {m.viewAll}
            </Link>
          </div>
          <div className="grid4">
            {products
              .filter((p) => p.featured)
              .slice(0, 4)
              .map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
          </div>
        </section>
      </div>
      <section className="why section">
        <div className="container">
          <div className="section-head">
            <h2>{m.whyTitle}</h2>
            <p className="muted" style={{ maxWidth: 440 }}>
              {m.whyText}
            </p>
          </div>
          <div className="grid4">
            {[
              { Icon: Layers, title: m.benefit1, text: m.benefit1Text },
              { Icon: MoveHorizontal, title: m.benefit2, text: m.benefit2Text },
              { Icon: Package, title: m.benefit3, text: m.benefit3Text },
              { Icon: MessageCircle, title: m.benefit4, text: m.benefit4Text },
            ].map(({ Icon, title, text }) => (
              <div className="benefit" key={title}>
                <Icon size={28} />
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <div className="container">
        <section className="section">
          <FoilHelper />
        </section>
        <section className="wholesale-banner">
          <div>
            <h2>{m.wholesaleTitle}</h2>
            <p>{m.wholesaleText}</p>
            <Link className="btn" href="/wholesale">
              {m.requestQuote}
              <ArrowUpRight size={18} />
            </Link>
          </div>
          <Image
            src={productPlaceholders.wholesale.src}
            alt={m.images.bulkRoll}
            width={600}
            height={400}
            sizes="(max-width: 600px) 90vw, 40vw"
          />
        </section>
        <section className="stats">
          {[
            [String(products.length), m.statsProducts],
            ["2", m.statsMarkets],
            ["2", m.statsMethods],
          ].map(([n, l]) => (
            <div key={l}>
              <strong>{n}</strong>
              <span className="muted small">{l}</span>
            </div>
          ))}
        </section>
        <section className="testimonial">
          <h2>{m.testimonialsTitle}</h2>
          <p className="muted">{m.testimonialsText}</p>
        </section>
        <section className="section">
          <div className="section-head">
            <h2>{m.blog}</h2>
            <Link href="/blog" className="link">
              {m.allGuides}
            </Link>
          </div>
          <div className="grid3">
            {posts.slice(0, 3).map((p) => (
              <article className="guide" key={p.id}>
                <Link href={`/blog/${locale === "sq" ? p.slugSq : p.slug}`}>
                  <Image
                    src={resolveImage(p.image)}
                    alt={p.translations[locale].name}
                    width={480}
                    height={320}
                    sizes="(max-width: 600px) 90vw, 30vw"
                  />
                  <h3>{p.translations[locale].name}</h3>
                  <p>{p.translations[locale].description}</p>
                  <span className="link">{m.readGuide}</span>
                </Link>
              </article>
            ))}
          </div>
        </section>
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="section-head">
            <h2>{m.faq}</h2>
            <Link href="/faq" className="link">
              {m.viewAll}
            </Link>
          </div>
          {m.faqs.slice(0, 4).map((f) => (
            <details className="faq-item" key={f.q}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </section>
        <section className="final-cta">
          <div>
            <h2>{m.finalTitle}</h2>
            <Link href="/shop" className="link">
              {m.shopNow}
            </Link>
          </div>
          <div>
            <p className="muted">{m.newsletterText}</p>
            <Newsletter />
          </div>
        </section>
      </div>
    </main>
  );
}
