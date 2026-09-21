import { notFound, permanentRedirect } from "next/navigation";
import { getProducts, getCategories } from "@/lib/catalog";
import { messages } from "@/lib/messages";
import { metadata } from "@/lib/seo";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/config";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { ProductCard } from "@/components/product/products";
import { FilterToggle } from "@/components/product/shop";
type Props = {
  params: Promise<{ locale: Locale; category?: string[] }>;
  searchParams: Promise<Record<string, string | undefined>>;
};
export const revalidate = 300;
/** Categories carry a slug per locale, so a URL may arrive under either one. */
const findCategory = (cats: Awaited<ReturnType<typeof getCategories>>, slug?: string) =>
  slug ? cats.find((c) => c.slug === slug || c.slugSq === slug) : undefined;

export async function generateMetadata({ params }: Props) {
  const { locale, category } = await params;
  const cats = await getCategories();
  const c = findCategory(cats, category?.[0]);
  return metadata(
    locale,
    `/shop${c ? `/${c.slug}` : ""}`,
    c?.translations[locale].name ?? messages(locale).shop,
    c?.translations[locale].description ?? messages(locale).heroText,
    c
      ? { paths: { sq: `/shop/${c.slugSq}`, en: `/shop/${c.slug}` } }
      : { paths: { sq: "/shop", en: "/shop" } },
  );
}
export default async function Shop({ params, searchParams }: Props) {
  const { locale, category } = await params;
  const q = await searchParams;
  const m = messages(locale);
  const [all, cats] = await Promise.all([getProducts(), getCategories()]);
  const cat = findCategory(cats, category?.[0]);
  if (category && (category.length !== 1 || !cat)) notFound();
  // One canonical URL per locale: redirect the other locale's slug rather than
  // serving the same listing on two addresses.
  if (cat) {
    const expected = locale === "sq" ? cat.slugSq : cat.slug;
    if (category?.[0] !== expected) permanentRedirect(`/${locale}/shop/${expected}`);
  }
  const categoryId = cat?.id || q.category;
  let products = all.filter(
    (p) =>
      (!categoryId || p.categoryId === categoryId) &&
      (!q.q || p.translations[locale].name.toLowerCase().includes(q.q.toLowerCase())) &&
      p.variants.some(
        (v) =>
          (!q.width || v.width === Number(q.width)) &&
          (!q.length || v.length === Number(q.length)) &&
          (!q.thickness || v.thicknessMicrons === Number(q.thickness)) &&
          (!q.min || v.price >= Number(q.min)) &&
          (!q.max || v.price <= Number(q.max)) &&
          (!q.stock || v.stock > 0),
      ),
  );
  if (q.sale) products = [];
  if (q.sort === "priceAsc") products.sort((a, b) => a.variants[0].price - b.variants[0].price);
  if (q.sort === "priceDesc") products.sort((a, b) => b.variants[0].price - a.variants[0].price);
  if (q.sort === "featured") products.sort((a, b) => Number(b.featured) - Number(a.featured));
  const perPage = 9;
  const pages = Math.max(1, Math.ceil(products.length / perPage));
  const page = Math.min(pages, Math.max(1, Number(q.page) || 1));
  const path = `/shop${cat ? `/${locale === "sq" ? cat.slugSq : cat.slug}` : ""}`;
  const pageLink = (n: number) => {
    const sp = new URLSearchParams(
      Object.entries(q).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
    );
    sp.set("page", String(n));
    return `${path}?${sp}`;
  };
  return (
    <main id="main" className="container">
      <Breadcrumbs
        locale={locale}
        items={[
          { name: m.shop, path: "/shop" },
          ...(cat ? [{ name: cat.translations[locale].name, path }] : []),
        ]}
      />
      <div className="page-head">
        <h1>{cat?.translations[locale].name ?? m.shop}</h1>
        <p className="muted">{cat?.translations[locale].description ?? m.categoriesTitle}</p>
      </div>
      <FilterToggle />
      <div className="shop-layout section" style={{ paddingTop: 24 }}>
        <form className="filters" id="shop-filters" action={`/${locale}${path}`}>
          <label>
            {m.search}
            <input name="q" defaultValue={q.q} type="search" maxLength={100} />
          </label>
          {!cat && (
            <label>
              {m.category}
              <select name="category" defaultValue={q.category ?? ""}>
                <option value="">{m.allCategories}</option>
                {cats.map((c) => (
                  <option value={c.id} key={c.id}>
                    {c.translations[locale].name}
                  </option>
                ))}
              </select>
            </label>
          )}
          {[
            ["width", m.width],
            ["length", m.length],
            ["thickness", m.thickness],
          ].map(([key, label]) => (
            <label key={key}>
              {label}
              <input name={key} type="number" min={0} step="any" defaultValue={q[key]} />
            </label>
          ))}
          <div className="grid2" style={{ gap: 12 }}>
            <label>
              {m.minPrice}
              <input name="min" type="number" min={0} step="0.01" defaultValue={q.min} />
            </label>
            <label>
              {m.maxPrice}
              <input name="max" type="number" min={0} step="0.01" defaultValue={q.max} />
            </label>
          </div>
          <label className="check">
            <input type="checkbox" name="stock" value="1" defaultChecked={!!q.stock} />
            {m.inStock}
          </label>
          <label className="check">
            <input type="checkbox" name="sale" value="1" defaultChecked={!!q.sale} />
            {m.saleOnly}
          </label>
          <label>
            {m.sort}
            <select name="sort" defaultValue={q.sort ?? "newest"}>
              {(["newest", "priceAsc", "priceDesc", "featured"] as const).map((s) => (
                <option value={s} key={s}>
                  {m[s]}
                </option>
              ))}
            </select>
          </label>
          <button className="btn">{m.applyFilters}</button>
          <Link className="link small" href={path}>
            {m.clearFilters}
          </Link>
        </form>
        <div>
          <div className="shop-toolbar">
            <p className="small muted" style={{ margin: 0 }}>
              {m.results.replace("{count}", String(products.length))}
            </p>
            {Object.keys(q).some((k) => q[k] && k !== "page") && (
              <Link className="badge" href={path}>
                {m.clearFilters} ×
              </Link>
            )}
          </div>
          {products.length ? (
            <div className="product-grid">
              {products.slice((page - 1) * perPage, page * perPage).map((p) => (
                <ProductCard product={p} key={p.id} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>{m.noResults}</p>
              <Link className="btn secondary" href={path}>
                {m.clearFilters}
              </Link>
            </div>
          )}
          {pages > 1 && (
            <nav className="pagination" aria-label={m.page}>
              {page > 1 && (
                <Link className="btn secondary" href={pageLink(page - 1)} rel="prev">
                  {m.previous}
                </Link>
              )}
              {Array.from({ length: pages }, (_, i) => (
                <Link
                  className={`btn ${page === i + 1 ? "" : "secondary"}`}
                  key={i}
                  href={pageLink(i + 1)}
                  aria-current={page === i + 1 ? "page" : undefined}
                >
                  {i + 1}
                </Link>
              ))}
              {page < pages && (
                <Link className="btn secondary" href={pageLink(page + 1)} rel="next">
                  {m.next}
                </Link>
              )}
            </nav>
          )}
        </div>
      </div>
    </main>
  );
}
