import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth/guards";
import { getSettings, demoMode } from "@/lib/catalog";
import { messages } from "@/lib/messages";
import { formatPrice, type Locale } from "@/lib/config";
import { metadata } from "@/lib/seo";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { Link } from "@/lib/i18n/navigation";
export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  return metadata(locale, "/order", messages(locale).order, "EchoFoil", { private: true });
}
export default async function Order({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale; orderNumber: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { locale, orderNumber } = await params;
  const { token } = await searchParams;
  if (demoMode) notFound();
  const user = await currentUser();
  const order = await db.order.findFirst({
    where: {
      orderNumber,
      OR: [...(token ? [{ accessToken: token }] : []), ...(user ? [{ userId: user.id }] : [])],
    },
    include: { items: true, events: { where: { internal: false }, orderBy: { createdAt: "asc" } } },
  });
  if (!order) notFound();
  const m = messages(locale);
  const settings = await getSettings();
  return (
    <main id="main" className="container">
      <Breadcrumbs locale={locale} items={[{ name: m.order, path: `/order/${orderNumber}` }]} />
      <section className="section">
        <h1>{m.orderThanks}</h1>
        <p>{m.orderConfirmed}</p>
        <div className="row wrap">
          <strong>{order.orderNumber}</strong>
          <span className="badge">{m[order.status]}</span>
        </div>
        <div className="grid2" style={{ marginTop: 40 }}>
          <div className="panel">
            <h2>{m.order}</h2>
            {order.items.map((i) => (
              <div className="summary-line" key={i.id}>
                <span>
                  {i.quantity} × {i.name}
                </span>
                <span>{formatPrice(Number(i.unitPrice) * i.quantity, locale)}</span>
              </div>
            ))}
            <hr />
            <div className="summary-line">
              <span>{m.shipping}</span>
              <span>{formatPrice(Number(order.shipping), locale)}</span>
            </div>
            <div className="summary-line">
              <strong>{m.total}</strong>
              <strong>{formatPrice(Number(order.total), locale)}</strong>
            </div>
          </div>
          <div>
            <h2>{m[order.paymentMethod === "bank" ? "bank" : "cod"]}</h2>
            {order.paymentMethod === "bank" && (
              <>
                <p>{m.bankInstructions}</p>
                <p>
                  {settings.accountName}
                  <br />
                  {settings.bankName}
                  <br />
                  {settings.iban}
                  <br />
                  {settings.swift}
                </p>
              </>
            )}
            {order.events.map((e) => (
              <p key={e.id} className="small muted">
                {new Intl.DateTimeFormat(locale === "sq" ? "sq-AL" : "en-GB", {
                  dateStyle: "medium",
                }).format(e.createdAt)}{" "}
                · {(m[e.status as keyof typeof m] as string) || e.status}
              </p>
            ))}
            <Link className="btn secondary" href={user ? "/account/orders" : "/register"}>
              {user ? m.orders : m.register}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
