/**
 * Single source of truth for anything the owner may want to change without
 * touching components. Values that must be editable *at runtime* by the owner
 * live in the SiteSetting table instead (see lib/settings.ts) - this file holds
 * the compile-time defaults and the shape of the shop itself.
 */

export const locales = ["sq", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "sq";

export const localeNames: Record<Locale, string> = {
  sq: "Shqip",
  en: "English",
};

export const siteConfig = {
  name: "EchoFoil",
  domain: "echofoil.com",
  currency: "EUR",
  /** Locale used purely for number/price formatting per app locale. */
  numberLocale: { sq: "sq-AL", en: "en-IE" } as Record<Locale, string>,
  /** Orders at or above this subtotal ship free. Overridable in admin settings. */
  freeShippingThreshold: 50,
  /** Flat shipping fee below the threshold. Overridable in admin settings. */
  shippingFlatRate: 3.5,
  /** VAT is assumed included in displayed prices (Kosovo/Albania retail norm). */
  vatIncluded: true,
  vatRate: 0.18,
  productsPerPage: 12,
  postsPerPage: 9,
} as const;

export const contactDefaults = {
  email: "info@echofoil.com",
  phone: "+383 44 000 000",
  whatsapp: "38344000000",
  addressLine: "Rr. Industriale 1",
  city: "Prishtine",
  country: "XK",
  postalCode: "10000",
  mapQuery: "Prishtine, Kosovo",
} as const;

export const bankDefaults = {
  accountName: "EchoFoil SH.P.K.",
  bankName: "Banka Ekonomike",
  iban: "XK00 0000 0000 0000 0000",
  swift: "EKOMXKPR",
} as const;

export const socialDefaults = {
  instagram: "https://instagram.com/echofoil",
  facebook: "https://facebook.com/echofoil",
  linkedin: "",
  tiktok: "",
} as const;

/** Bulk tiers offered by default when a variant has no explicit PriceTier rows. */
export const defaultPriceTiers = [
  { minQty: 10, discountPct: 5 },
  { minQty: 50, discountPct: 12 },
  { minQty: 200, discountPct: 20 },
] as const;

export function formatPrice(
  amount: number,
  locale: Locale = defaultLocale,
  currency: string = siteConfig.currency,
): string {
  return new Intl.NumberFormat(siteConfig.numberLocale[locale] ?? "en-IE", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}
