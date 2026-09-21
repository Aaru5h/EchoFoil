import { db } from "./db";
import {
  demoProducts,
  demoPosts,
  categories,
  type CatalogProduct,
  type Translation,
} from "./catalog-data";
import type { Locale } from "./config";
export const demoMode = !process.env.DATABASE_URL;
export async function getProducts(): Promise<CatalogProduct[]> {
  if (demoMode) return demoProducts;
  const products = await db.product.findMany({
    where: { published: true },
    include: {
      variants: { include: { priceTiers: true } },
      images: { orderBy: { position: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });
  return products.map((p) => ({
    ...p,
    translations: p.translations as Record<Locale, Translation>,
    variants: p.variants.map((v) => ({ ...v, price: Number(v.price) })),
  }));
}
export async function getCategories() {
  return demoMode
    ? categories
    : (await db.category.findMany()).map((c) => ({
        ...c,
        translations: c.translations as Record<Locale, Translation>,
      }));
}
export async function getPosts() {
  return demoMode
    ? demoPosts
    : (await db.post.findMany({ where: { published: true }, orderBy: { createdAt: "desc" } })).map(
        (p) => ({ ...p, translations: p.translations as Record<Locale, Translation> }),
      );
}
export async function getSettings() {
  const base = {
    shippingRate: 3.5,
    freeShippingThreshold: 50,
    bankName: "",
    accountName: "",
    iban: "",
    swift: "",
    email: "",
    phone: "",
    address: "",
    announcement: true,
  };
  if (demoMode) return base;
  const row = await db.siteSetting.findUnique({ where: { key: "business" } });
  return { ...base, ...((row?.value as Partial<typeof base>) ?? {}) };
}
