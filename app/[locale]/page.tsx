import Image from "next/image";
import { ArrowUpRight, ArrowRight, Mail, Phone } from "lucide-react";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/lib/i18n/navigation";
import { getProducts, getCategories, getPosts, getSettings } from "@/lib/catalog";
import { messages } from "@/lib/messages";
import { metadata } from "@/lib/seo";
import { defaultPriceTiers, type Locale } from "@/lib/config";
import { resolveImage, photos } from "@/lib/images";
import { ProductTable, FoilHelper } from "@/components/product/products";
import { Newsletter } from "@/components/layout/shell";
export const revalidate = 300;
export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const m = messages(locale);
  return metadata(locale, "", m.heroTitle, m.heroText);
}
const fill = (s: string, vars: Record<string, string | number>) =>
  s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
/** "11–14" or "11" when every product in the group shares one value. */
function range(values: number[]) {
  const v = values.filter((n) => n > 0);
  if (!v.length) return null;
  const lo = Math.min(...v);
  const hi = Math.max(...v);
  return lo === hi ? `${lo}` : `${lo}–${hi}`;
}
export default async function Home({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const m = messages(locale);
  const [products, categories, posts, settings] = await Promise.all([
    getProducts(),
    getCategories(),
    getPosts(),
    getSettings(),
  ]);
  const featured = products.filter((p) => p.featured).slice(0, 6);
  const guidePhotos = [photos.meal, photos.dough];
  return (
    <main id="main">
      <section className="hero">
        <Image src={photos.heroFoil} alt="" fill priority sizes="100vw" className="hero-photo" />
        <div className="container hero-copy">
          <h1>{m.heroTitle}</h1>
          <p>{m.heroText}</p>
          <div className="hero-actions">
            <Link className="btn" href="/shop">
              {m.shopNow}
              <ArrowRight size={18} />
            </Link>
            <Link className="btn on-dark" href="/wholesale">
              {m.requestQuote}
            </Link>
          </div>
        </div>
      </section>
      <ul className="facts container">
        <li>{m.delivery}</li>
        <li>{m.bulk}</li>
        <li>{m.paymentTrust}</li>
      </ul>

      <div className="container">
        <section className="section">
          <header className="section-head">
            <h2>{m.rangeTitle}</h2>
            <p>{m.rangeText}</p>
          </header>
          <div className="range">
            {categories.map((c) => {
              const items = products.filter((p) => p.categoryId === c.id);
              const vs = items.map((p) => p.variants[0]).filter(Boolean);
              const width = range(vs.map((v) => v.width));
              const thick = range(vs.map((v) => v.thicknessMicrons));
              return (
                <Link
                  href={`/shop/${locale === "sq" ? c.slugSq : c.slug}`}
                  className="range-tile"
                  key={c.id}
                >
                  <div className="range-photo">
                    <Image
                      src={resolveImage(c.image)}
                      alt=""
                      fill
                      sizes="(max-width: 600px) 50vw, 25vw"
                    />
                  </div>
                  <h3>
                    {c.translations[locale].name}
                    <ArrowUpRight size={18} aria-hidden="true" />
                  </h3>
                  <dl>
                    {width && (
                      <div>
                        <dt>{m.widthShort}</dt>
                        <dd>{width} cm</dd>
                      </div>
                    )}
                    {thick && (
                      <div>
                        <dt>{m.thicknessShort}</dt>
                        <dd>{thick} µm</dd>
                      </div>
                    )}
                    <div>
                      <dt>{m.productsLabel}</dt>
                      <dd>{items.length}</dd>
                    </div>
                  </dl>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="section" style={{ paddingTop: 0 }}>
          <header className="section-head">
            <h2>{m.featuredTitle}</h2>
            <Link href="/shop" className="link">
              {m.viewAll}
            </Link>
          </header>
          <ProductTable products={featured} />
        </section>

        <section className="section finder-section">
          <FoilHelper />
        </section>
      </div>

      <section className="business">
        <div className="business-photo">
          <Image src={photos.chef} alt="" fill sizes="(max-width: 800px) 100vw, 50vw" />
        </div>
        <div className="business-copy">
          <h2>{m.businessTitle}</h2>
          <p>{m.businessText}</p>
          <table className="tiers">
            <caption>{m.tiersTitle}</caption>
            <tbody>
              <tr>
                <th scope="row">{fill(m.tierUnits, { qty: 1 })}</th>
                <td>{m.tierBase}</td>
              </tr>
              {defaultPriceTiers.map((tier) => (
                <tr key={tier.minQty}>
                  <th scope="row">{fill(m.tierUnits, { qty: tier.minQty })}</th>
                  <td>{fill(m.tierOff, { pct: tier.discountPct })}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Link className="btn on-dark-solid" href="/wholesale">
            {m.requestQuote}
            <ArrowRight size={18} />
          </Link>
          {(settings.email || settings.phone) && (
            <p className="business-contact">
              {settings.phone && (
                <a href={`tel:${settings.phone}`}>
                  <Phone size={15} />
                  {settings.phone}
                </a>
              )}
              {settings.email && (
                <a href={`mailto:${settings.email}`}>
                  <Mail size={15} />
                  {settings.email}
                </a>
              )}
            </p>
          )}
        </div>
      </section>

      <div className="container">
        <section className="section">
          <header className="section-head">
            <h2>{m.processTitle}</h2>
            <p>{m.processText}</p>
          </header>
          <ol className="process">
            {m.process.map((s) => (
              <li key={s.title}>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="section" style={{ paddingTop: 0 }}>
          <header className="section-head">
            <h2>{m.guidesTitle}</h2>
            <Link href="/blog" className="link">
              {m.allGuides}
            </Link>
          </header>
          <div className="guides">
            {posts.slice(0, 3).map((p, i) => (
              <article className="guide" key={p.id}>
                <Link href={`/blog/${locale === "sq" ? p.slugSq : p.slug}`}>
                  <div className="guide-photo">
                    <Image
                      src={guidePhotos[i] ?? resolveImage(p.image)}
                      alt=""
                      fill
                      sizes="(max-width: 800px) 100vw, 33vw"
                    />
                  </div>
                  <h3>{p.translations[locale].name}</h3>
                  <p>{p.translations[locale].description}</p>
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="section faq-block" style={{ paddingTop: 0 }}>
          <header className="section-head">
            <h2>{m.faqTitle}</h2>
            <Link href="/faq" className="link">
              {m.faq}
            </Link>
          </header>
          <div>
            {m.faqs.slice(0, 5).map((f) => (
              <details className="faq-item" key={f.q}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="final-cta">
          <div>
            <h2>{m.contactTitle}</h2>
            <p className="muted">{m.contactText}</p>
            <div className="row wrap">
              <Link href="/contact" className="btn">
                {m.contact}
                <ArrowRight size={18} />
              </Link>
              <Link href="/wholesale" className="btn secondary">
                {m.requestQuote}
              </Link>
            </div>
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
