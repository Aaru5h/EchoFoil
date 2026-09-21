"use client";
import Image from "next/image";
import { ShoppingBag, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCart } from "./provider";
import { Link } from "@/lib/i18n/navigation";
import { formatPrice, type Locale } from "@/lib/config";
import { resolveImage } from "@/lib/images";
import { totals, unitPrice } from "@/lib/pricing";
import { Stepper } from "@/components/ui/primitives";
import { useState } from "react";
export function CartContents({ drawer = false }: { drawer?: boolean }) {
  const cart = useCart();
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const [promo, setPromo] = useState(false);
  const lines = cart.items.flatMap((i) => {
    const p = cart.products.find((p) => p.variants.some((v) => v.id === i.variantId));
    const v = p?.variants.find((v) => v.id === i.variantId);
    return p && v
      ? [{ ...i, product: p, variant: v, price: v.price, priceTiers: v.priceTiers }]
      : [];
  });
  const total = totals(lines);
  if (!cart.ready) return <div className="skeleton" aria-label={t("loading")} />;
  if (!lines.length)
    return (
      <div className="empty-state">
        <ShoppingBag size={48} />
        <h2>{t("cartEmpty")}</h2>
        <p className="muted">{t("cartEmptyText")}</p>
        <Link className="btn" href="/shop" onClick={() => cart.setOpen(false)}>
          {t("backShop")}
        </Link>
      </div>
    );
  return (
    <div className={drawer ? "" : "checkout-layout"}>
      <div>
        {lines.map((l) => (
          <div className="cart-line" key={l.variantId}>
            <Image
              src={resolveImage(l.product.images[0]?.src)}
              width={80}
              height={80}
              alt={l.product.translations[locale].name}
            />
            <div>
              <Link
                href={`/product/${locale === "sq" ? l.product.slugSq : l.product.slug}`}
                onClick={() => cart.setOpen(false)}
              >
                <h3 style={{ marginTop: 0 }}>{l.product.translations[locale].name}</h3>
              </Link>
              <p className="small muted">
                {l.variant.width} cm · {l.variant.length} m · {l.variant.thicknessMicrons} μm
              </p>
              <Stepper
                value={l.quantity}
                max={Math.min(999, l.variant.stock)}
                onChange={(q) => cart.setQuantity(l.variantId, q)}
              />
            </div>
            <div className="stack" style={{ justifyItems: "end", gap: 8 }}>
              <span>
                {formatPrice(unitPrice(l.price, l.quantity, l.priceTiers) * l.quantity, locale)}
              </span>
              <button
                className="icon-btn"
                aria-label={`${t("remove")} ${l.product.translations[locale].name}`}
                onClick={() => cart.setQuantity(l.variantId, 0)}
              >
                <Trash2 size={17} />
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className={drawer ? "" : "panel order-summary"}>
        <div className="progress">
          <span style={{ width: `${Math.min(100, (total.subtotal / 50) * 100)}%` }} />
        </div>
        <p className="small">
          {total.remaining === 0
            ? t("freeShipping")
            : t("untilFree", { amount: formatPrice(total.remaining, locale) })}
        </p>
        <div className="summary-line">
          <span>{t("subtotal")}</span>
          <span>{formatPrice(total.subtotal, locale)}</span>
        </div>
        <div className="summary-line">
          <span>{t("shipping")}</span>
          <span>{formatPrice(total.shipping, locale)}</span>
        </div>
        <hr />
        <div className="summary-line">
          <strong>{t("total")}</strong>
          <strong>{formatPrice(total.total, locale)}</strong>
        </div>
        <p className="small muted">{t("vat")}</p>
        <Link
          href="/checkout"
          className="btn"
          style={{ width: "100%" }}
          onClick={() => cart.setOpen(false)}
        >
          {t("checkout")}
        </Link>
        {drawer && (
          <Link
            href="/cart"
            className="btn secondary"
            style={{ width: "100%", marginTop: 12 }}
            onClick={() => cart.setOpen(false)}
          >
            {t("cart")}
          </Link>
        )}
        <form
          className="row"
          style={{ marginTop: 24 }}
          onSubmit={(e) => {
            e.preventDefault();
            setPromo(true);
          }}
        >
          <input aria-label={t("promoCode")} placeholder={t("promoCode")} maxLength={50} />
          <button className="btn secondary">{t("apply")}</button>
        </form>
        {promo && (
          <p role="status" className="small muted">
            {t("promoUnavailable")}
          </p>
        )}
      </div>
    </div>
  );
}
