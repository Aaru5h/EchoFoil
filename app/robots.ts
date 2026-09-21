import type { MetadataRoute } from "next";
import { baseUrl } from "@/lib/seo";
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/api",
        "/*/account",
        "/*/cart",
        "/*/checkout",
        "/*/order",
        "/*/login",
        "/*/register",
        "/*/reset-password",
        "/*/verify-email",
        "/*/track-order",
        "/*?*",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
