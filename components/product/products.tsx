"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Heart, Plus, ArrowRight, Share2, Truck } from "lucide-react";
import { toast } from "sonner";
import { Link, useRouter } from "@/lib/i18n/navigation";
import { resolveImage } from "@/lib/images";
import { formatPrice, type Locale } from "@/lib/config";
import type { CatalogProduct } from "@/lib/catalog-data";
import { useCart } from "@/components/cart/provider";
import { Stepper, Modal } from "@/components/ui/primitives";
import { unitPrice } from "@/lib/pricing";
export function ProductCard({ product: p }: { product: CatalogProduct }) {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const c = useCart();
  const v = p.variants[0];
  if (!v) return null;
  return (
    <article className="product-card">
      <button
        className="icon-btn heart"
        aria-label={`${t("saveProduct")} ${p.translations[locale].name}`}
        aria-pressed={c.wishlist.includes(p.id)}
        onClick={() => c.toggleWish(p.id)}
      >
        <Heart size={18} fill={c.wishlist.includes(p.id) ? "currentColor" : "none"} />
      </button>
      <Link href={`/product/${locale === "sq" ? p.slugSq : p.slug}`}>
        <div className="image-stage">
          <Image
            src={resolveImage(p.images[0]?.src)}
            alt={p.translations[locale].name}
            width={400}
            height={400}
            sizes="(max-width: 600px) 45vw, (max-width: 1024px) 30vw, 280px"
          />
        </div>
        <h3>{p.translations[locale].name}</h3>
        <div className="small muted">
          {v.width} cm · {v.length} m · {v.thicknessMicrons} μm
        </div>
      </Link>
      <div className="price-row">
        <div className="price">{formatPrice(v.price, locale)}</div>
        <button
          className="icon-btn quick-add"
          aria-label={`${t("addToCart")} ${p.translations[locale].name}`}
          disabled={v.stock < 1}
          onClick={() => c.add(v.id)}
        >
          <Plus size={20} />
        </button>
      </div>
      <span className="small muted">{t(v.stock > 0 ? "inStock" : "outOfStock")}</span>
    </article>
  );
}
export function FoilHelper() {
  const t = useTranslations();
  const c = useCart();
  const locale = useLocale() as Locale;
  const [choice, setChoice] = useState("household");
  const p = c.products.find((p) => p.categoryId === choice);
  return (
    <div className="helper">
      <div>
        <h2>{t("helperTitle")}</h2>
        <p className="muted">{t("helperText")}</p>
        <div className="helper-options">
          {[
            ["household", "homeUse"],
            ["professional", "businessUse"],
            ["baking", "bakingUse"],
          ].map(([id, label]) => (
            <button
              className="btn secondary"
              key={id}
              aria-pressed={choice === id}
              onClick={() => setChoice(id)}
            >
              {t(label)}
            </button>
          ))}
        </div>
      </div>
      {p && (
        <Link className="helper-result" href={`/product/${locale === "sq" ? p.slugSq : p.slug}`}>
          <Image
            src={resolveImage(p.images[0]?.src)}
            width={180}
            height={180}
            alt={p.translations[locale].name}
          />
          <div>
            <span className="small muted">{t("recommended")}</span>
            <h3>{p.translations[locale].name}</h3>
            <span className="row small">
              {p.variants[0].width} cm · {p.variants[0].thicknessMicrons} μm{" "}
              <ArrowRight size={16} />
            </span>
          </div>
        </Link>
      )}
    </div>
  );
}
export function ProductPurchase({ product: p }: { product: CatalogProduct }) {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const c = useCart();
  const router = useRouter();
  const [variantId, setVariant] = useState(p.variants[0]?.id);
  const [quantity, setQuantity] = useState(1);
  const v = p.variants.find((v) => v.id === variantId);
  useEffect(() => {
    try {
      const existing = JSON.parse(localStorage.getItem("echofoil-recent") || "[]");
      localStorage.setItem(
        "echofoil-recent",
        JSON.stringify([p.id, ...existing.filter((id: string) => id !== p.id)].slice(0, 8)),
      );
    } catch {}
  }, [p.id]);
  if (!v) return <p>{t("outOfStock")}</p>;
  const price = unitPrice(v.price, quantity, v.priceTiers);
  return (
    <>
      <div className="row wrap">
        <span className="badge">{t(v.stock > 0 ? "inStock" : "outOfStock")}</span>
        <span className="small muted">
          {t("sku")}: {v.sku}
        </span>
      </div>
      <div className="price-large" style={{ marginTop: 20 }}>
        {formatPrice(price, locale)}
      </div>
      <p className="small muted">{t("vat")}</p>
      <label>
        {t("specifications")}
        <select
          value={variantId}
          onChange={(e) => {
            setVariant(e.target.value);
            setQuantity(1);
          }}
        >
          {p.variants.map((v) => (
            <option key={v.id} value={v.id}>
              {v.width} cm × {v.length} m · {v.thicknessMicrons} μm
            </option>
          ))}
        </select>
      </label>
      <div className="buy-row">
        <Stepper value={quantity} max={Math.min(999, v.stock || 1)} onChange={setQuantity} />
        <button className="btn" disabled={!v.stock} onClick={() => c.add(v.id, quantity)}>
          {t("addToCart")}
          <Plus size={18} />
        </button>
      </div>
      <div className="row wrap">
        <button
          className="btn secondary"
          disabled={!v.stock}
          onClick={() => {
            c.add(v.id, quantity);
            router.push("/checkout");
          }}
        >
          {t("buyNow")}
        </button>
        <button
          className="icon-btn"
          aria-label={t("saveProduct")}
          aria-pressed={c.wishlist.includes(p.id)}
          onClick={() => c.toggleWish(p.id)}
        >
          <Heart size={20} fill={c.wishlist.includes(p.id) ? "currentColor" : "none"} />
        </button>
        <button
          className="icon-btn"
          aria-label={t("share")}
          onClick={async () => {
            try {
              if (navigator.share)
                await navigator.share({ title: p.translations[locale].name, url: location.href });
              else {
                await navigator.clipboard.writeText(location.href);
                toast.success(t("copied"));
              }
            } catch {}
          }}
        >
          <Share2 size={20} />
        </button>
      </div>
      <h3 style={{ marginTop: 32 }}>{t("bulk")}</h3>
      <table className="table">
        <thead>
          <tr>
            <th>{t("quantity")}</th>
            <th>{t("unitPrice")}</th>
          </tr>
        </thead>
        <tbody>
          <tr className={quantity < 10 ? "active" : ""}>
            <td>1+</td>
            <td>{formatPrice(v.price, locale)}</td>
          </tr>
          {v.priceTiers.map((tier, i) => (
            <tr
              key={tier.minQty}
              className={
                quantity >= tier.minQty && quantity < (v.priceTiers[i + 1]?.minQty ?? Infinity)
                  ? "active"
                  : ""
              }
            >
              <td>{tier.minQty}+</td>
              <td>{formatPrice(unitPrice(v.price, tier.minQty, v.priceTiers), locale)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="row small muted" style={{ marginTop: 24 }}>
        <Truck size={20} />
        {t("deliveryText")}
      </p>
      <div className="sticky-buy mobile-only">
        <strong>{formatPrice(price, locale)}</strong>
        <button className="btn" disabled={!v.stock} onClick={() => c.add(v.id, quantity)}>
          {t("addToCart")}
        </button>
      </div>
    </>
  );
}
export function Gallery({ product: p }: { product: CatalogProduct }) {
  const locale = useLocale() as Locale;
  const t = useTranslations();
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState(false);
  const src = resolveImage(p.images[index]?.src);
  return (
    <div className="gallery">
      <button
        aria-label={t("details")}
        style={{ border: 0, padding: 0, background: "none", width: "100%" }}
        onClick={() => setZoom(true)}
      >
        <Image
          src={src}
          width={800}
          height={800}
          alt={p.translations[locale].name}
          priority
          sizes="(max-width: 600px) 100vw, 50vw"
        />
      </button>
      {p.images.length > 1 && (
        <div className="gallery-thumbs">
          {p.images.map((im, i) => (
            <button
              key={i}
              aria-label={`${t("details")} ${i + 1}`}
              aria-pressed={index === i}
              onClick={() => setIndex(i)}
            >
              <Image src={resolveImage(im.src)} alt="" width={72} height={72} />
            </button>
          ))}
        </div>
      )}
      <Modal open={zoom} onOpenChange={setZoom} title={p.translations[locale].name}>
        <Image
          src={src}
          width={800}
          height={800}
          alt={p.translations[locale].name}
          className="zoom-image"
        />
      </Modal>
    </div>
  );
}
export function RecentlyViewed({ current }: { current: string }) {
  const c = useCart();
  const t = useTranslations();
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => {
    try {
      setIds(JSON.parse(localStorage.getItem("echofoil-recent") || "[]"));
    } catch {}
  }, []);
  const products = c.products.filter((p) => ids.includes(p.id) && p.id !== current).slice(0, 4);
  return products.length ? (
    <section className="section">
      <h2>{t("recentlyViewed")}</h2>
      <div className="grid4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  ) : null;
}
export function Wishlist() {
  const c = useCart();
  const t = useTranslations();
  const products = c.products.filter((p) => c.wishlist.includes(p.id));
  return products.length ? (
    <div className="product-grid">
      {products.map((p) => (
        <ProductCard product={p} key={p.id} />
      ))}
    </div>
  ) : (
    <div className="empty-state">
      <Heart size={40} />
      <p>{t("empty")}</p>
      <Link href="/shop" className="btn">
        {t("backShop")}
      </Link>
    </div>
  );
}
export function Reorder({ items }: { items: { variantId: string; quantity: number }[] }) {
  const c = useCart();
  const t = useTranslations();
  return (
    <button
      className="btn secondary no-print"
      onClick={() => {
        for (const i of items) c.add(i.variantId, i.quantity);
        c.setOpen(true);
      }}
    >
      {t("reorder")}
    </button>
  );
}
