import type { Metadata } from "next";
import localFont from "next/font/local";
import { getLocale } from "next-intl/server";
import "./globals.css";
const inter = localFont({
  src: [
    { path: "../public/fonts/inter-6.woff2", weight: "100 900", style: "normal" },
    { path: "../public/fonts/inter-5.woff2", weight: "100 900", style: "normal" },
  ],
  display: "swap",
  variable: "--font-inter",
});
const sora = localFont({
  src: [
    { path: "../public/fonts/sora-1.woff2", weight: "100 800", style: "normal" },
    { path: "../public/fonts/sora-0.woff2", weight: "100 800", style: "normal" },
  ],
  display: "swap",
  variable: "--font-sora",
});
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: { default: "EchoFoil", template: "%s | EchoFoil" },
  description: "Aluminium foil and kitchen essentials for Kosovo and Albania.",
};
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${inter.variable} ${sora.variable}`}>
        <span hidden data-design-contract="4e800934">
          THESIS: Everyday materials presented with precise specifications. OWN-WORLD: Green
          owner-supplied mark, cool white, silver stages and echo rings. STORY: Choose a product or
          request a business quote. FIRST VIEWPORT: Large left headline, two clear actions and a
          right foil stage; product-first mobile flow. FORM: Pinned original brief and handoff;
          code-led implementation under delegated decisions. FINISH: unreviewed and undocumented is
          unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every
          shipping raster carrying its provenance
        </span>
        {children}
      </body>
    </html>
  );
}
