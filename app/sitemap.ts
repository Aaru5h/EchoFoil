import type { MetadataRoute } from "next";
import { getProducts, getPosts, getCategories } from "@/lib/catalog";
import { baseUrl } from "@/lib/seo";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, posts, categories] = await Promise.all([
    getProducts(),
    getPosts(),
    getCategories(),
  ]);
  const paths = [
    ...[
      "",
      "/shop",
      "/wholesale",
      "/about",
      "/contact",
      "/faq",
      "/blog",
      "/shipping-returns",
      "/privacy",
      "/terms",
      "/cookies",
    ].map((p) => ({ en: p, sq: p })),
    ...categories.map((c) => ({ en: `/shop/${c.slug}`, sq: `/shop/${c.slugSq}` })),
    ...products.map((p) => ({ en: `/product/${p.slug}`, sq: `/product/${p.slugSq}` })),
    ...posts.map((p) => ({ en: `/blog/${p.slug}`, sq: `/blog/${p.slugSq}` })),
  ];
  return paths.flatMap((path) =>
    (["sq", "en"] as const).map((locale) => ({
      url: `${baseUrl}/${locale}${path[locale]}`,
      lastModified: new Date("2026-09-21"),
      alternates: {
        languages: {
          sq: `${baseUrl}/sq${path.sq}`,
          en: `${baseUrl}/en${path.en}`,
          "x-default": `${baseUrl}/sq${path.sq}`,
        },
      },
    })),
  );
}
