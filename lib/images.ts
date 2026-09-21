/**
 * Single image manifest.
 *
 * Components never hardcode an image path - they import from here. To swap in
 * real photography the owner replaces the file in /public/images and, if the
 * filename changed, edits one line below. Alt text lives beside the path so a
 * new image can never ship without one; `alt` is a translation key resolved by
 * the caller via next-intl, falling back to `altFallback` for non-UI contexts
 * (OG images, emails, seed data).
 */

export type ManagedImage = {
  src: string;
  width: number;
  height: number;
  /** next-intl key under the `images` namespace. */
  alt: string;
  /** Plain English used where no translator is available (emails, OG, seed). */
  altFallback: string;
};

const PLACEHOLDER = "/images/placeholders";
const BRAND = "/images/brand";

export const brandImages = {
  /** Currency-colour SVG mark. Inherits `currentColor` so it themes for free. */
  mark: `${BRAND}/echofoil-mark.svg`,
  /** Raster lockups supplied by the owner - used for OG cards and email headers. */
  lockupOnLight: `${BRAND}/echofoil-logo-light-bg.jpeg`,
  lockupOnSage: `${BRAND}/echofoil-logo-sage.jpeg`,
  lockupOnGreen: `${BRAND}/echofoil-logo-green.jpeg`,
  markStacked: `${BRAND}/echofoil-mark-stacked.jpeg`,
} as const;

export const productPlaceholders = {
  household: {
    src: `${PLACEHOLDER}/foil-roll-household.svg`,
    width: 800,
    height: 800,
    alt: "images.householdRoll",
    altFallback: "EchoFoil household aluminium foil roll",
  },
  catering: {
    src: `${PLACEHOLDER}/foil-roll-catering.svg`,
    width: 800,
    height: 800,
    alt: "images.cateringRoll",
    altFallback: "EchoFoil catering aluminium foil roll",
  },
  wholesale: {
    src: `${PLACEHOLDER}/foil-roll-bulk.svg`,
    width: 800,
    height: 800,
    alt: "images.bulkRoll",
    altFallback: "EchoFoil bulk aluminium foil roll for wholesale",
  },
  trays: {
    src: `${PLACEHOLDER}/foil-tray.svg`,
    width: 800,
    height: 800,
    alt: "images.tray",
    altFallback: "EchoFoil aluminium foil takeaway tray",
  },
  sheets: {
    src: `${PLACEHOLDER}/foil-sheets.svg`,
    width: 800,
    height: 800,
    alt: "images.sheets",
    altFallback: "EchoFoil pre-cut aluminium foil sheets",
  },
  bakingPaper: {
    src: `${PLACEHOLDER}/baking-paper.svg`,
    width: 800,
    height: 800,
    alt: "images.bakingPaper",
    altFallback: "EchoFoil greaseproof baking paper roll",
  },
} as const satisfies Record<string, ManagedImage>;

export type PlaceholderKey = keyof typeof productPlaceholders;

/** Product/category rows store a key OR an absolute uploaded URL. */
export function resolveImage(src: string | null | undefined): string {
  if (!src) return productPlaceholders.household.src;
  if (src.startsWith("http") || src.startsWith("/")) return src;
  const known = productPlaceholders[src as PlaceholderKey];
  return known ? known.src : productPlaceholders.household.src;
}

/**
 * 8px silver shimmer used as the blur placeholder. Inline base64 so it costs no
 * request and prevents CLS while the real image decodes.
 */
export const BLUR_DATA_URL =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA4IDgiPjxyZWN0IHdpZHRoPSI4IiBoZWlnaHQ9IjgiIGZpbGw9IiNlNmVhZTciLz48L3N2Zz4=";
