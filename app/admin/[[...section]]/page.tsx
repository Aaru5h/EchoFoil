import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/catalog";
import { demoProducts, demoPosts, categories } from "@/lib/catalog-data";
import { RecordEditor, DataTable, Chart, Upload, PackingPrint } from "@/components/admin/admin";
import { Logout } from "@/components/forms/account";
import a from "@/messages/admin.json";
import type { Translation } from "@/lib/catalog-data";
export const metadata = {
  title: "Administration | EchoFoil",
  robots: { index: false, follow: false },
};
const sections = [
  "products",
  "categories",
  "orders",
  "customers",
  "quotes",
  "messages",
  "posts",
  "media",
  "settings",
  "reviews",
];
export default async function Admin({ params }: { params: Promise<{ section?: string[] }> }) {
  await requireAdmin();
  const { section } = await params;
  const resource = section?.[0] ?? "dashboard";
  const id = section?.[1];
  if ((resource !== "dashboard" && !sections.includes(resource)) || (section && section.length > 2))
    notFound();
  let content: React.ReactNode;
  if (resource === "dashboard") {
    const [orders, stock, quotes, contacts] = await Promise.all([
      db.order.findMany({ orderBy: { createdAt: "desc" } }),
      db.productVariant.count({ where: { stock: { lt: 10 } } }),
      db.quoteRequest.count({ where: { status: "NEW" } }),
      db.contactMessage.count({ where: { status: "NEW" } }),
    ]);
    const revenue = orders
      .filter((o) => o.status === "DELIVERED")
      .reduce((s, o) => s + Number(o.total), 0);
    const today = new Date().toISOString().slice(0, 10);
    const days = Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - 13 + i);
      const date = d.toISOString().slice(0, 10);
      return {
        date: date.slice(5),
        revenue: orders
          .filter((o) => o.status === "DELIVERED" && o.createdAt.toISOString().startsWith(date))
          .reduce((s, o) => s + Number(o.total), 0),
      };
    });
    content = (
      <>
        <div className="admin-stats">
          {[
            [a.revenue, `€${revenue.toFixed(2)}`],
            [
              a.ordersToday,
              orders.filter((o) => o.createdAt.toISOString().startsWith(today)).length,
            ],
            [a.lowStock, stock],
            [a.inquiries, quotes + contacts],
          ].map(([label, value]) => (
            <div className="panel" key={label}>
              <span className="muted small">{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
        <Chart data={days} />
        <DataTable
          resource="orders"
          rows={orders
            .slice(0, 20)
            .map((o) => ({
              id: o.id,
              name: o.orderNumber,
              status: o.status,
              total: `€${o.total}`,
              created: o.createdAt.toISOString().slice(0, 10),
            }))}
        />
      </>
    );
  } else if (resource === "settings") {
    content = <RecordEditor resource={resource} initial={await getSettings()} />;
  } else if (resource === "media") {
    content = <Upload />;
  } else if (resource === "products") {
    if (id) {
      const record =
        id === "new"
          ? null
          : await db.product.findUnique({
              where: { id },
              include: { variants: { include: { priceTiers: true } }, images: true },
            });
      if (id !== "new" && !record) notFound();
      const p = record
        ? {
            id: record.id,
            slug: record.slug,
            slugSq: record.slugSq,
            categoryId: record.categoryId,
            published: record.published,
            featured: record.featured,
            translations: record.translations,
            variants: record.variants.map((v) => ({
              id: v.id,
              sku: v.sku,
              width: v.width,
              length: v.length,
              thicknessMicrons: v.thicknessMicrons,
              price: Number(v.price),
              compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : null,
              stock: v.stock,
              weight: v.weight,
              priceTiers: v.priceTiers.map((t) => ({
                minQty: t.minQty,
                discountPct: t.discountPct,
              })),
            })),
            images: record.images.map((im) => ({ src: im.src, alt: im.alt })),
          }
        : {
            ...demoProducts[0],
            id: undefined,
            slug: "new-product",
            slugSq: "produkt-i-ri",
            published: false,
            variants: demoProducts[0].variants.map((v) => ({ ...v, id: undefined, sku: "EF-NEW" })),
          };
      content = <RecordEditor resource={resource} id={record?.id} initial={p} />;
    } else {
      const rows = await db.product.findMany({ orderBy: { createdAt: "desc" } });
      content = (
        <>
          <Link className="btn" href="/admin/products/new">
            {a.new}
          </Link>
          <div style={{ marginTop: 24 }}>
            <DataTable
              resource={resource}
              rows={rows.map((p) => ({
                id: p.id,
                name: (p.translations as Record<string, Translation>).en.name,
                status: p.published ? "Published" : "Draft",
              }))}
            />
          </div>
        </>
      );
    }
  } else if (resource === "categories") {
    const rows = await db.category.findMany();
    if (id) {
      const record = id === "new" ? null : rows.find((c) => c.id === id);
      if (id !== "new" && !record) notFound();
      content = (
        <RecordEditor
          resource={resource}
          id={record?.id}
          initial={
            record ?? {
              ...categories[0],
              id: undefined,
              slug: "new-category",
              slugSq: "kategori-e-re",
            }
          }
        />
      );
    } else
      content = (
        <>
          <Link className="btn" href="/admin/categories/new">
            {a.new}
          </Link>
          <DataTable
            resource={resource}
            rows={rows.map((c) => ({
              id: c.id,
              name: (c.translations as Record<string, Translation>).en.name,
            }))}
          />
        </>
      );
  } else if (resource === "posts") {
    const rows = await db.post.findMany();
    if (id) {
      const record = id === "new" ? null : rows.find((p) => p.id === id);
      if (id !== "new" && !record) notFound();
      content = (
        <RecordEditor
          resource={resource}
          id={record?.id}
          initial={
            record
              ? {
                  id: record.id,
                  slug: record.slug,
                  slugSq: record.slugSq,
                  translations: record.translations,
                  image: record.image,
                  published: record.published,
                }
              : {
                  ...demoPosts[0],
                  id: undefined,
                  slug: "new-guide",
                  slugSq: "udhezues-i-ri",
                  published: false,
                }
          }
        />
      );
    } else
      content = (
        <>
          <Link className="btn" href="/admin/posts/new">
            {a.new}
          </Link>
          <DataTable
            resource={resource}
            rows={rows.map((p) => ({
              id: p.id,
              name: (p.translations as Record<string, Translation>).en.name,
              status: p.published ? "Published" : "Draft",
            }))}
          />
        </>
      );
  } else if (resource === "orders") {
    if (id) {
      const order = await db.order.findUnique({
        where: { id },
        include: { items: true, events: true },
      });
      if (!order) notFound();
      const address = order.address as Record<string, string>;
      content = (
        <>
          <h2>{order.orderNumber}</h2>
          <p>{order.email}</p>
          <p>{Object.values(address).join(", ")}</p>
          <table className="table">
            <tbody>
              {order.items.map((i) => (
                <tr key={i.id}>
                  <td>{i.sku}</td>
                  <td>{i.name}</td>
                  <td>{i.quantity}</td>
                  <td>€{String(i.unitPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ marginTop: 24 }}>€{String(order.total)}</p>
          <PackingPrint />
          <div className="no-print">
            <RecordEditor
              resource={resource}
              initial={{
                id: order.id,
                status: order.status,
                paymentStatus: order.paymentStatus,
                note: "",
              }}
            />
            {order.events.map((e) => (
              <p key={e.id} className="small muted">
                {e.createdAt.toISOString()} · {e.status} · {e.note}
              </p>
            ))}
          </div>
        </>
      );
    } else
      content = (
        <DataTable
          resource={resource}
          rows={(await db.order.findMany({ orderBy: { createdAt: "desc" } })).map((o) => ({
            id: o.id,
            name: o.orderNumber,
            status: o.status,
            total: `€${o.total}`,
            created: o.createdAt.toISOString().slice(0, 10),
          }))}
        />
      );
  } else if (resource === "customers") {
    if (id) {
      const user = await db.user.findUnique({
        where: { id },
        include: { orders: true, addresses: true },
      });
      if (!user) notFound();
      content = (
        <>
          <h2>{user.name}</h2>
          <p>{user.email}</p>
          <p>{user.locale}</p>
          <DataTable
            resource="orders"
            rows={user.orders.map((o) => ({
              id: o.id,
              name: o.orderNumber,
              status: o.status,
              total: `€${o.total}`,
            }))}
          />
        </>
      );
    } else
      content = (
        <DataTable
          resource={resource}
          rows={(await db.user.findMany({ orderBy: { createdAt: "desc" } })).map((u) => ({
            id: u.id,
            name: `${u.name ?? ""} · ${u.email}`,
            status: u.role,
            created: u.createdAt.toISOString().slice(0, 10),
          }))}
        />
      );
  } else if (resource === "quotes") {
    if (id) {
      const q = await db.quoteRequest.findUnique({ where: { id } });
      if (!q) notFound();
      content = (
        <>
          <h2>{q.company}</h2>
          <p>
            {q.name} · {q.email} · {q.phone}
          </p>
          <p>
            {q.volume} · {q.location}
          </p>
          <p style={{ whiteSpace: "pre-wrap" }}>{q.message}</p>
          {q.attachment && (
            <a
              className="link"
              href={`/api/quote-attachment?id=${q.id}`}
              target="_blank"
              rel="noreferrer"
            >
              {a.media}
            </a>
          )}
          <p>
            <a
              className="btn secondary"
              href={`mailto:${q.email}?subject=${encodeURIComponent("EchoFoil quote")}`}
            >
              {a.reply}
            </a>
          </p>
          <RecordEditor
            resource={resource}
            initial={{ id: q.id, status: q.status, note: q.notes ?? "" }}
          />
        </>
      );
    } else
      content = (
        <DataTable
          resource={resource}
          rows={(await db.quoteRequest.findMany({ orderBy: { createdAt: "desc" } })).map((q) => ({
            id: q.id,
            name: q.company,
            status: q.status,
            created: q.createdAt.toISOString().slice(0, 10),
          }))}
        />
      );
  } else if (resource === "messages") {
    if (id) {
      const q = await db.contactMessage.findUnique({ where: { id } });
      if (!q) notFound();
      content = (
        <>
          <h2>{q.name}</h2>
          <p>{q.email}</p>
          <p style={{ whiteSpace: "pre-wrap" }}>{q.message}</p>
          <a className="btn secondary" href={`mailto:${q.email}`}>
            {a.reply}
          </a>
          <RecordEditor resource={resource} initial={{ id: q.id, status: q.status }} />
        </>
      );
    } else
      content = (
        <DataTable
          resource={resource}
          rows={(await db.contactMessage.findMany({ orderBy: { createdAt: "desc" } })).map((q) => ({
            id: q.id,
            name: `${q.name} · ${q.email}`,
            status: q.status,
            created: q.createdAt.toISOString().slice(0, 10),
          }))}
        />
      );
  } else if (resource === "reviews") {
    const rows = await db.review.findMany({
      include: { user: { select: { name: true } }, product: true },
      orderBy: { createdAt: "desc" },
    });
    if (id) {
      const review = rows.find((r) => r.id === id);
      if (!review) notFound();
      content = (
        <>
          <p>
            {review.user.name} · {review.rating} / 5
          </p>
          <p>{review.body}</p>
          <RecordEditor
            resource={resource}
            initial={{ id: review.id, approved: review.approved }}
          />
        </>
      );
    } else
      content = (
        <DataTable
          resource={resource}
          rows={rows.map((r) => ({
            id: r.id,
            name: `${r.user.name} · ${(r.product.translations as Record<string, Translation>).en.name}`,
            status: r.approved ? "Approved" : "Pending",
          }))}
        />
      );
  }
  return (
    <div className="admin-shell">
      <nav className="admin-nav no-print">
        <Link href="/admin" className="brand">
          EchoFoil
        </Link>
        <Link href="/admin">{a.dashboard}</Link>
        {sections.map((s) => (
          <Link key={s} href={`/admin/${s}`}>
            {String(a[s as keyof typeof a])}
          </Link>
        ))}
        <Link href="/sq">{a.storefront}</Link>
        <Logout locale="sq" />
      </nav>
      <main id="main" className="admin-main">
        <h1>{String(a[resource as keyof typeof a])}</h1>
        {content}
      </main>
    </div>
  );
}
