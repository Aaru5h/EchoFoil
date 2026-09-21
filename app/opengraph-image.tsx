import { ImageResponse } from "next/og";
export const alt = "EchoFoil · Aluminium foil & kitchen essentials";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function Image() {
  return new ImageResponse(
    <div
      style={{
        background: "#e4eee6",
        color: "#244f3b",
        width: "100%",
        height: "100%",
        display: "flex",
        padding: 80,
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div style={{ fontSize: 44 }}>EchoFoil</div>
      <div style={{ fontSize: 84, maxWidth: 950, lineHeight: 1.05 }}>
        Good things deserve a better wrap.
      </div>
      <div style={{ fontSize: 26 }}>Kosovë · Shqipëri</div>
    </div>,
    size,
  );
}
