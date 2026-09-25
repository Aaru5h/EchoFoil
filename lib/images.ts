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

// ponytail: Unsplash-licensed stand-ins (origin embedded in each JPEG) until the owner
// supplies real EchoFoil product photography. The old SVG illustrations stay in
// /images/placeholders for reference.
const PHOTOS = "/images/photos";
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

export const photos = {
  heroFoil: `${PHOTOS}/foil-dark.jpg`,
  chef: `${PHOTOS}/chef-kitchen.jpg`,
  dough: `${PHOTOS}/dough-baking-paper.jpg`,
  meal: `${PHOTOS}/meal-trays-2.jpg`,
} as const;

export const productPlaceholders = {
  household: {
    src: `${PHOTOS}/foil-bright.jpg`,
    width: 1600,
    height: 1067,
    alt: "images.householdRoll",
    altFallback: "EchoFoil household aluminium foil roll",
  },
  catering: {
    src: `${PHOTOS}/grill-trays.jpg`,
    width: 1600,
    height: 1067,
    alt: "images.cateringRoll",
    altFallback: "EchoFoil catering aluminium foil roll",
  },
  wholesale: {
    src: `${PHOTOS}/covered-tray.jpg`,
    width: 1600,
    height: 1059,
    alt: "images.bulkRoll",
    altFallback: "EchoFoil bulk aluminium foil roll for wholesale",
  },
  trays: {
    src: `${PHOTOS}/meal-trays.jpg`,
    width: 1600,
    height: 1067,
    alt: "images.tray",
    altFallback: "EchoFoil aluminium foil takeaway tray",
  },
  sheets: {
    src: `${PHOTOS}/foil-bright.jpg`,
    width: 1600,
    height: 1067,
    alt: "images.sheets",
    altFallback: "EchoFoil pre-cut aluminium foil sheets",
  },
  bakingPaper: {
    src: `${PHOTOS}/baking-paper.jpg`,
    width: 1600,
    height: 2400,
    alt: "images.bakingPaper",
    altFallback: "EchoFoil greaseproof baking paper roll",
  },
  householdAlt: {
    src: `${PHOTOS}/foil-dark.jpg`,
    width: 2400,
    height: 1600,
    alt: "images.householdRoll",
    altFallback: "Close-up of crumpled aluminium foil",
  },
  traysAlt: {
    src: `${PHOTOS}/meal-trays-2.jpg`,
    width: 1600,
    height: 1067,
    alt: "images.tray",
    altFallback: "Aluminium foil containers with a prepared meal",
  },
  bakingAlt: {
    src: `${PHOTOS}/dough-baking-paper.jpg`,
    width: 1600,
    height: 1067,
    alt: "images.bakingPaper",
    altFallback: "Dough balls on baking paper",
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
