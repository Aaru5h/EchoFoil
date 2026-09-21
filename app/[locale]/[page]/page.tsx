import Image from "next/image";
import { notFound } from "next/navigation";
import { getPosts, getSettings } from "@/lib/catalog";
import { messages } from "@/lib/messages";
import { metadata, JsonLd, baseUrl } from "@/lib/seo";
import type { Locale } from "@/lib/config";
import { resolveImage, brandImages } from "@/lib/images";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { SimpleForm } from "@/components/forms/simple-form";
import { CartContents } from "@/components/cart/cart";
import { Checkout } from "@/components/cart/checkout";
import { Link } from "@/lib/i18n/navigation";
const pages = [
  "cart",
  "checkout",
  "track-order",
  "wholesale",
  "about",
  "contact",
  "faq",
  "blog",
  "shipping-returns",
  "privacy",
  "terms",
  "cookies",
  "login",
  "register",
  "forgot-password",
  "reset-password",
  "verify-email",
  "newsletter-confirm",
];
export const dynamicParams = false;
export function generateStaticParams() {
  return pages.map((page) => ({ page }));
}
type Props = {
  params: Promise<{ locale: Locale; page: string }>;
  searchParams: Promise<{ token?: string }>;
};
const privatePages = [
  "cart",
  "checkout",
  "track-order",
  "login",
  "register",
  "forgot-password",
  "reset-password",
  "verify-email",
  "newsletter-confirm",
];
export async function generateMetadata({ params }: Props) {
  const { locale, page } = await params;
  const m = messages(locale);
  const title =
    typeof m[page as keyof typeof m] === "string"
      ? String(m[page as keyof typeof m])
      : m.newsletter;
  return metadata(locale, `/${page}`, title, `${title}. ${m.heroText}`, {
    private: privatePages.includes(page),
  });
}
export default async function Page({ params, searchParams }: Props) {
  const { locale, page } = await params;
  if (!pages.includes(page)) notFound();
  const m = messages(locale);
  const settings = await getSettings();
  const token = (await searchParams).token ?? "";
  const title =
    typeof m[page as keyof typeof m] === "string"
      ? String(m[page as keyof typeof m])
      : m.newsletter;
  const authPages = [
    "login",
    "register",
    "forgot-password",
    "reset-password",
    "verify-email",
    "newsletter-confirm",
  ];
  return (
    <main id="main" className="container">
      <Breadcrumbs locale={locale} items={[{ name: title, path: `/${page}` }]} />
      {authPages.includes(page) ? (
        <div className="auth-box">
          <h1>{title}</h1>
          <SimpleForm
            key={page}
            kind={page}
            token={token}
            google={!!(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET)}
          />
          {page === "login" && (
            <div className="form-footer stack">
              <Link className="link" href="/forgot-password">
                {m["forgot-password"]}
              </Link>
              <span>
                {m.noAccount}{" "}
                <Link className="link" href="/register">
                  {m.register}
                </Link>
              </span>
            </div>
          )}
          {page === "register" && (
            <p className="form-footer">
              {m.haveAccount}{" "}
              <Link href="/login" className="link">
                {m.login}
              </Link>
            </p>
          )}
          {page === "verify-email" && <SimpleForm kind="resend-verification" />}
        </div>
      ) : (
        <>
          <div className="page-head">
            <h1>
              {page === "about" ? m.aboutTitle : page === "wholesale" ? m.wholesaleTitle : title}
            </h1>
            {page === "wholesale" && <p className="muted">{m.wholesaleText}</p>}
          </div>
          <section className="section" style={{ paddingTop: 0 }}>
            {page === "cart" && <CartContents />}
            {page === "checkout" && (
              <Checkout
                bankAvailable={!!(settings.iban && settings.bankName && settings.accountName)}
                shippingRate={settings.shippingRate}
                threshold={settings.freeShippingThreshold}
              />
            )}
            {page === "track-order" && <SimpleForm kind="track-order" />}
            {page === "wholesale" && (
              <div className="grid2">
                <div>
                  <h2>{m.whyTitle}</h2>
                  <p className="muted">{m.wholesaleText}</p>
                  {[m.benefit2Text, m.benefit3Text, m.benefit4Text].map((p) => (
                    <p key={p}>{p}</p>
                  ))}
                  <Link href="/shop" className="link">
                    {m.viewAll}
                  </Link>
                </div>
                <div className="panel">
                  <SimpleForm kind="quote" />
                </div>
              </div>
            )}
            {page === "about" && (
              <>
                <div className="grid2">
                  <div>
                    <p>{m.aboutText}</p>
                    <h2 style={{ marginTop: 40 }}>{m.sustainability}</h2>
                    <p className="muted">{m.sustainabilityText}</p>
                    <Link className="btn" href="/shop">
                      {m.shopNow}
                    </Link>
                  </div>
                  <Image
                    src={brandImages.lockupOnSage}
                    alt="EchoFoil"
                    width={800}
                    height={800}
                    sizes="(max-width:600px) 100vw, 50vw"
                    style={{ width: "100%", height: "auto", borderRadius: 16 }}
                  />
                </div>
              </>
            )}
            {page === "contact" && (
              <div className="grid2">
                <div>
                  <p>{m.contactText}</p>
                  {settings.email ? (
                    <p>
                      <a className="link" href={`mailto:${settings.email}`}>
                        {settings.email}
                      </a>
                    </p>
                  ) : (
                    <p className="notice">{m.businessPending}</p>
                  )}
                  {settings.phone && (
                    <p>
                      <a href={`tel:${settings.phone}`} className="link">
                        {settings.phone}
                      </a>
                    </p>
                  )}
                  {settings.address && (
                    <>
                      <p>{settings.address}</p>
                      <a
                        className="link"
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.address)}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {m.location}
                      </a>
                    </>
                  )}
                </div>
                <SimpleForm kind="contact" />
              </div>
            )}
            {page === "faq" && (
              <>
                <div className="prose">
                  {m.faqs.map((f) => (
                    <details className="faq-item" key={f.q}>
                      <summary>{f.q}</summary>
                      <p>{f.a}</p>
                    </details>
                  ))}
                </div>
                <JsonLd
                  data={{
                    "@context": "https://schema.org",
                    "@type": "FAQPage",
                    mainEntity: m.faqs.map((f) => ({
                      "@type": "Question",
                      name: f.q,
                      acceptedAnswer: { "@type": "Answer", text: f.a },
                    })),
                  }}
                />
              </>
            )}
            {page === "blog" && (
              <div className="grid3">
                {(await getPosts()).map((p) => (
                  <article className="guide" key={p.id}>
                    <Link href={`/blog/${locale === "sq" ? p.slugSq : p.slug}`}>
                      <Image
                        src={resolveImage(p.image)}
                        alt={p.translations[locale].name}
                        width={480}
                        height={320}
                        sizes="(max-width:600px) 100vw, 33vw"
                      />
                      <h2 style={{ fontSize: "1.5rem", marginTop: 24 }}>
                        {p.translations[locale].name}
                      </h2>
                      <p>{p.translations[locale].description}</p>
                      <span className="link">{m.readGuide}</span>
                    </Link>
                  </article>
                ))}
              </div>
            )}
            {["shipping-returns", "privacy", "terms", "cookies"].includes(page) && (
              <div className="prose">
                <p className="notice">{m.legalDraft}</p>
                {m.legal[page as keyof typeof m.legal].map((s) => (
                  <section key={s.title}>
                    <h2>{s.title}</h2>
                    <p>{s.body}</p>
                  </section>
                ))}
                <Link href="/contact" className="link">
                  {m.contact}
                </Link>
              </div>
            )}
          </section>
        </>
      )}
      {["about", "contact"].includes(page) && settings.address && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            name: "EchoFoil",
            url: baseUrl,
            address: settings.address,
            telephone: settings.phone,
            email: settings.email,
          }}
        />
      )}
    </main>
  );
}
