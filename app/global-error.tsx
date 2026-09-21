"use client";
import { messages } from "@/lib/messages";
export default function GlobalError({ reset }: { reset: () => void }) {
  const m = messages("sq");
  return (
    <html lang="sq">
      <body>
        <main style={{ padding: 40, fontFamily: "sans-serif" }}>
          <h1>{m.error}</h1>
          <button onClick={reset}>{m.retry}</button>
        </main>
      </body>
    </html>
  );
}
