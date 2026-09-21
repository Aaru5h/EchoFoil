import type { MetadataRoute } from "next";
import { brandImages } from "@/lib/images";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "EchoFoil",
    short_name: "EchoFoil",
    description: "Aluminium foil and kitchen essentials",
    start_url: "/sq",
    display: "standalone",
    background_color: "#f6f7f8",
    theme_color: "#2f6e51",
    icons: [{ src: brandImages.mark, sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
