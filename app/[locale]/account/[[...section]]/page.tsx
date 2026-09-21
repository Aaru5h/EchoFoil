import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { messages } from "@/lib/messages";
import { metadata } from "@/lib/seo";
import { formatPrice, type Locale } from "@/lib/config";
import { Link } from "@/lib/i18n/navigation";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { Wishlist, Reorder } from "@/components/product/products";
import { SimpleForm } from "@/components/forms/simple-form";
import { Addresses, Logout } from "@/components/forms/account";
import { PrintButton } from "@/components/ui/primitives";
const sections = ["orders", "addresses", "wishlist", "quotes", "profile", "security"];
type Props = { params: Promise<{ locale: Locale; section?: string[] }> };
export async function generateMetadata({ params }: Props) {
  const { locale, section } = await params;
  const m = messages(locale);
  const title = m[(section?.[0] || "account") as keyof typeof m] as string;
  return metadata(locale, `/account${section ? "/" + section.join("/") : ""}`, title, m.account, {
    private: true,
  });
}
export default async function Account({ params }: Props) {
  const { locale, section } = await params;
  const user = await requireUser(locale);
  const m = messages(locale);
  const current = section?.[0] || "account";
  if (current !== "account" && !sections.includes(current)) notFound();
  if (section && section.length > 1 && (current !== "orders" || section.length !== 2)) notFound();
  const orders = ["account", "orders"].includes(current)
    ? await db.order.findMany({
        where: { userId: user.id },
        include: { items: true, events: { where: { internal: false } } },
        orderBy: { createdAt: "desc" },
      })
    : [];
  const detail = section?.[1] ? orders.find((o) => o.id === section[1]) : null;
  if (section?.[1] && !detail) notFound();
  const address = detail?.address as
    { name: string; line1: string; city: string; postalCode: string; country: string } | undefined;
  return (
    <main id="main" className="container">
      <Breadcrumbs
        locale={locale}
        items={[
          { name: m.account, path: "/account" },
          ...(section
            ? [{ name: m[current as keyof typeof m] as string, path: `/account/${current}` }]
            : []),
        ]}
      />
      <section className="section account-layout">
        <nav className="account-nav">
          {["account", ...sections].map((s) => (
            <Link
              key={s}
              href={s === "account" ? "/account" : `/account/${s}`}
              aria-current={s === current ? "page" : undefined}
            >
              {m[s as keyof typeof m] as string}
            </Link>
          ))}
        </nav>
        <div className="account-content">
          <h1>{m[current as keyof typeof m] as string}</h1>
          {current === "account" && (
            <>
              <p>{user.name || user.email}</p>
              <div className="row wrap" style={{ marginBottom: 32 }}>
                <Link href="/account/orders" className="btn">
                  {m.orders}
                </Link>
                <Link href="/account/profile" className="btn secondary">
                  {m.profile}
                </Link>
                <Logout locale={locale} />
              </div>
            </>
          )}
          {["account", "orders"].includes(current) &&
            !detail &&
            (orders.length ? (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>{m.order}</th>
                      <th>{m.status}</th>
                      <th>{m.total}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, current === "account" ? 5 : 100).map((o) => (
                      <tr key={o.id}>
                        <td>
                          <Link className="link" href={`/account/orders/${o.id}`}>
                            {o.orderNumber}
                          </Link>
                          <div className="small muted">
                            {o.createdAt.toLocaleDateString(locale === "sq" ? "sq-AL" : "en-GB")}
                          </div>
                        </td>
                        <td>
                          <span className="badge">{m[o.status]}</span>
                        </td>
                        <td>{formatPrice(Number(o.total), locale)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="notice">{m.empty}</p>
            ))}
          {detail && (
            <>
              <h2>{detail.orderNumber}</h2>
              <p>
                <span className="badge">{m[detail.status]}</span>
              </p>
              <p>
                {address?.name}
                <br />
                {address?.line1}
                <br />
                {address?.postalCode} {address?.city}
              </p>
              <table className="table">
                <tbody>
                  {detail.items.map((i) => (
                    <tr key={i.id}>
                      <td>
                        {i.name}
                        <div className="small muted">{i.sku}</div>
                      </td>
                      <td>{i.quantity}</td>
                      <td>{formatPrice(Number(i.unitPrice) * i.quantity, locale)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="summary-line">
                <span>{m.shipping}</span>
                <span>{formatPrice(Number(detail.shipping), locale)}</span>
              </div>
              <div className="summary-line">
                <strong>{m.total}</strong>
                <strong>{formatPrice(Number(detail.total), locale)}</strong>
              </div>
              <div className="row wrap" style={{ marginTop: 24 }}>
                <PrintButton />
                <Reorder
                  items={detail.items.map((i) => ({
                    variantId: i.variantId,
                    quantity: i.quantity,
                  }))}
                />
              </div>
            </>
          )}
          {current === "addresses" && (
            <Addresses
              addresses={await db.address.findMany({
                where: { userId: user.id },
                orderBy: { isDefault: "desc" },
              })}
            />
          )}
          {current === "wishlist" && <Wishlist />}
          {current === "quotes" && (
            <div className="stack">
              {(
                await db.quoteRequest.findMany({
                  where: { userId: user.id },
                  orderBy: { createdAt: "desc" },
                })
              ).map((q) => (
                <article className="panel" key={q.id}>
                  <h3>{q.company}</h3>
                  <span className="badge">
                    {(m[q.status as keyof typeof m] as string) || q.status}
                  </span>
                  <p>{q.message}</p>
                </article>
              ))}
              <Link href="/wholesale" className="btn secondary">
                {m.requestQuote}
              </Link>
            </div>
          )}
          {current === "profile" && (
            <SimpleForm
              kind="profile"
              initial={{
                name: user.name ?? "",
                phone: user.phone ?? "",
                locale: user.locale,
                marketingConsent: user.marketingConsent,
              }}
            />
          )}
          {current === "security" && (
            <div className="stack">
              {user.passwordHash && (
                <>
                  <h2 style={{ fontSize: "1.5rem" }}>{m.changePassword}</h2>
                  <SimpleForm kind="change-password" />
                </>
              )}
              <h2 style={{ fontSize: "1.5rem" }}>{m.connectedAccounts}</h2>
              <ul>
                {(
                  await db.account.findMany({
                    where: { userId: user.id },
                    select: { id: true, provider: true },
                  })
                ).map((a) => (
                  <li key={a.id}>{a.provider}</li>
                ))}
              </ul>
              <a href="/api/export" className="btn secondary" download>
                {m.exportData}
              </a>
              <hr />
              <h2 style={{ fontSize: "1.5rem" }}>{m.deleteAccount}</h2>
              <SimpleForm kind="delete-account" />
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
