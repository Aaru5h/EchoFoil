import { ImageResponse } from "next/og";
import { getProducts } from "@/lib/catalog";
import type { Locale } from "@/lib/config";
export const alt = "EchoFoil";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default async function Image({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}) {
  const { locale, slug } = await params;
  const p = (await getProducts()).find((p) => p.slug === slug || p.slugSq === slug);
  return new ImageResponse(
    <div
      style={{
        background: "#e4eee6",
        color: "#244f3b",
        display: "flex",
        width: "100%",
        height: "100%",
        padding: 80,
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div style={{ fontSize: 40 }}>EchoFoil</div>
      <div style={{ fontSize: 72 }}>{p?.translations[locale]?.name ?? "EchoFoil"}</div>
      <div style={{ fontSize: 32 }}>
        {p
          ? `${p.variants[0]?.width} cm · ${p.variants[0]?.length} m · €${p.variants[0]?.price}`
          : ""}
      </div>
    </div>,
    size,
  );
}
