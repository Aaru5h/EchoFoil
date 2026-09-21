import type { Locale } from "./config";
export type Translation = {
  name: string;
  description: string;
  body?: string;
  seoTitle?: string;
  seoDescription?: string;
};
export type CatalogProduct = {
  id: string;
  slug: string;
  slugSq: string;
  categoryId: string;
  translations: Record<Locale, Translation>;
  featured: boolean;
  images: { src: string }[];
  variants: {
    id: string;
    sku: string;
    width: number;
    length: number;
    thicknessMicrons: number;
    price: number;
    stock: number;
    weight: number;
    priceTiers: { minQty: number; discountPct: number }[];
  }[];
};
export const categories = [
  {
    id: "household",
    slug: "household",
    slugSq: "per-cdo-dite",
    translations: {
      en: { name: "Everyday essentials", description: "For the kitchens we call home." },
      sq: { name: "Për çdo ditë", description: "Për kuzhinat që i quajmë shtëpi." },
    },
    image: "household",
  },
  {
    id: "professional",
    slug: "professional",
    slugSq: "kuzhine-profesionale",
    translations: {
      en: { name: "Professional kitchen", description: "Ready for the busiest service." },
      sq: { name: "Kuzhinë profesionale", description: "Gati për shërbimin më intensiv." },
    },
    image: "catering",
  },
  {
    id: "trays",
    slug: "trays",
    slugSq: "tava-dhe-ene",
    translations: {
      en: { name: "Trays & containers", description: "From your oven to their table." },
      sq: { name: "Tava dhe enë", description: "Nga furra juaj në tryezën e tyre." },
    },
    image: "trays",
  },
  {
    id: "baking",
    slug: "baking",
    slugSq: "pjekje-dhe-pergatitje",
    translations: {
      en: { name: "Baking & preparation", description: "A little help for every recipe." },
      sq: { name: "Pjekje dhe përgatitje", description: "Pak ndihmë për çdo recetë." },
    },
    image: "bakingPaper",
  },
];
const rows: [string, string, string, string, string, number, number, number, number][] = [
  [
    "everyday-foil-10m",
    "leter-alumini-10m",
    "Everyday foil · 10 m",
    "Letër alumini · 10 m",
    "household",
    2.4,
    30,
    10,
    12,
  ],
  [
    "everyday-foil-30m",
    "leter-alumini-30m",
    "Everyday foil · 30 m",
    "Letër alumini · 30 m",
    "household",
    5.9,
    30,
    30,
    12,
  ],
  [
    "strong-foil-20m",
    "leter-e-forte-20m",
    "Extra strong foil · 20 m",
    "Letër e fortë · 20 m",
    "household",
    6.5,
    30,
    20,
    18,
  ],
  [
    "catering-foil-100m",
    "alumin-profesional-100m",
    "Catering foil · 100 m",
    "Alumin profesional · 100 m",
    "professional",
    18.9,
    30,
    100,
    14,
  ],
  [
    "wide-catering-150m",
    "alumin-i-gjere-150m",
    "Wide catering foil · 150 m",
    "Alumin i gjerë · 150 m",
    "professional",
    32,
    45,
    150,
    14,
  ],
  [
    "heavy-duty-200m",
    "alumin-industrial-200m",
    "Heavy duty foil · 200 m",
    "Alumin industrial · 200 m",
    "professional",
    49,
    45,
    200,
    20,
  ],
  [
    "foil-trays-500ml",
    "tava-alumini-500ml",
    "Foil trays · 500 ml / 25",
    "Tava alumini · 500 ml / 25",
    "trays",
    6.9,
    15,
    0,
    60,
  ],
  [
    "foil-trays-1000ml",
    "tava-alumini-1000ml",
    "Foil trays · 1,000 ml / 25",
    "Tava alumini · 1.000 ml / 25",
    "trays",
    9.9,
    20,
    0,
    70,
  ],
  [
    "roasting-trays",
    "tava-per-pjekje",
    "Roasting trays · pack of 5",
    "Tava për pjekje · 5 copë",
    "trays",
    7.5,
    32,
    0,
    80,
  ],
  [
    "baking-paper-20m",
    "leter-pjekjeje-20m",
    "Baking paper · 20 m",
    "Letër pjekjeje · 20 m",
    "baking",
    3.9,
    38,
    20,
    0,
  ],
  [
    "precut-foil-sheets",
    "flete-alumini",
    "Pre-cut foil sheets · 200",
    "Fletë alumini · 200",
    "baking",
    8.9,
    30,
    0.27,
    14,
  ],
  [
    "baking-paper-50m",
    "leter-pjekjeje-50m",
    "Baking paper · 50 m",
    "Letër pjekjeje · 50 m",
    "baking",
    8.5,
    38,
    50,
    0,
  ],
];
export const demoProducts: CatalogProduct[] = rows.map(
  ([slug, slugSq, en, sq, categoryId, price, width, length, thicknessMicrons], i) => ({
    id: `product-${i + 1}`,
    slug,
    slugSq,
    categoryId,
    featured: i < 4,
    translations: {
      en: {
        name: en,
        description:
          "Practical preparation, cooking and storage for home and professional kitchens. Choose the size that fits your routine. Follow the appliance and food packaging instructions for safe use.",
      },
      sq: {
        name: sq,
        description:
          "Përgatitje, gatim dhe ruajtje praktike për kuzhina shtëpiake dhe profesionale. Zgjidhni madhësinë që i përshtatet rutinës suaj. Ndiqni udhëzimet e pajisjes dhe paketimit për përdorim të sigurt.",
      },
    },
    images: [
      {
        src:
          categoryId === "professional"
            ? i === 5
              ? "wholesale"
              : "catering"
            : categoryId === "trays"
              ? "trays"
              : categoryId === "baking"
                ? i === 10
                  ? "sheets"
                  : "bakingPaper"
                : "household",
      },
    ],
    variants: [
      {
        id: `variant-${i + 1}`,
        sku: `EF-${String(i + 1).padStart(3, "0")}`,
        width,
        length,
        thicknessMicrons,
        price,
        stock: 120,
        weight: 0.25,
        priceTiers: [
          { minQty: 10, discountPct: 5 },
          { minQty: 50, discountPct: 12 },
          { minQty: 200, discountPct: 20 },
        ],
      },
    ],
  }),
);
export const demoPosts = [
  {
    id: "post-1",
    slug: "choose-your-foil",
    slugSq: "zgjidhni-aluminin",
    translations: {
      en: {
        name: "A roll for every routine",
        description: "A practical guide to choosing the width, length and thickness you need.",
        body: "## Start with the task\nA small household roll is convenient for everyday food preparation. A wider roll gives you more coverage for large roasting trays.\n\n## Read the specifications\nCompare width, length and thickness before ordering. For business kitchens, review your weekly usage to choose a useful case size.\n\n## Follow the packaging\nAlways follow the instructions on your appliance and packaging. Keep foil away from exposed heating elements.",
      },
      sq: {
        name: "Një rrotull për çdo rutinë",
        description: "Udhëzues praktik për gjerësinë, gjatësinë dhe trashësinë që ju nevojitet.",
        body: "## Filloni nga përdorimi\nNjë rrotull shtëpiake është praktike për përgatitjen e përditshme. Një rrotull më e gjerë mbulon tavat e mëdha.\n\n## Lexoni specifikimet\nKrahasoni gjerësinë, gjatësinë dhe trashësinë para porosisë. Për kuzhina biznesi, shqyrtoni konsumin javor.\n\n## Ndiqni paketimin\nNdiqni gjithmonë udhëzimet e pajisjes dhe paketimit. Mbajeni aluminin larg elementeve të ekspozuara të ngrohjes.",
      },
    },
    image: "household",
  },
  {
    id: "post-2",
    slug: "organised-professional-kitchen",
    slugSq: "kuzhine-profesionale-e-organizuar",
    translations: {
      en: {
        name: "A better stocked kitchen",
        description: "Plan your supplies around your service.",
        body: "## Count what you use\nTrack rolls, trays and sheets over a typical week. Keep a small buffer for busy services.\n\n## Order with context\nInclude product sizes, expected volume and delivery location in your quote request. Our team can respond with a tailored offer.",
      },
      sq: {
        name: "Një kuzhinë e furnizuar më mirë",
        description: "Planifikoni furnizimet sipas shërbimit tuaj.",
        body: "## Matni përdorimin\nNdiqni rrotullat, tavat dhe fletët gjatë një jave të zakonshme. Mbani një rezervë për ditët me ngarkesë.\n\n## Porositni me informacion\nPërfshini madhësitë, sasinë dhe vendndodhjen e dorëzimit në kërkesën për ofertë.",
      },
    },
    image: "catering",
  },
  {
    id: "post-3",
    slug: "less-waste-in-preparation",
    slugSq: "me-pak-mbetje",
    translations: {
      en: {
        name: "Small habits, less waste",
        description: "Measure first and make your supplies go further.",
        body: "## Use the right size\nCut only the amount you need. Pre-cut sheets can make repeat preparation more consistent.\n\n## Check local collection\nRecycling rules differ by municipality. Ask your local collection service whether it accepts clean aluminium foil and trays. Do not assume heavily soiled packaging is accepted.",
      },
      sq: {
        name: "Zakone të vogla, më pak mbetje",
        description: "Matni së pari dhe përdorni furnizimet më me kujdes.",
        body: "## Përdorni madhësinë e duhur\nPrisni vetëm sasinë që ju nevojitet. Fletët e prera mund ta bëjnë përgatitjen më të njëtrajtshme.\n\n## Kontrolloni grumbullimin lokal\nRregullat e riciklimit ndryshojnë sipas komunës. Pyesni shërbimin lokal nëse pranon alumin të pastër dhe tava.",
      },
    },
    image: "sheets",
  },
];
