import Link from "next/link";
import { messages } from "@/lib/messages";
export default function NotFound() {
  const m = messages("sq");
  return (
    <main id="main" className="container section">
      <h1>{m.notFoundTitle}</h1>
      <p>{m.notFoundText}</p>
      <Link className="btn" href="/sq">
        {m.backHome}
      </Link>
    </main>
  );
}
