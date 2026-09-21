import { get } from "@vercel/blob";
import { apiAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { apiError } from "@/lib/http";
export async function GET(req: Request) {
  try {
    await apiAdmin();
    const id = new URL(req.url).searchParams.get("id");
    if (!id) throw new Error("NOT_FOUND");
    const quote = await db.quoteRequest.findUnique({ where: { id } });
    if (!quote?.attachment) throw new Error("NOT_FOUND");
    const result = await get(quote.attachment, {
      access: "private",
      token: process.env.BLOB_PRIVATE_READ_WRITE_TOKEN,
    });
    if (!result || result.statusCode !== 200) throw new Error("NOT_FOUND");
    return new Response(result.stream, {
      headers: {
        "Content-Type": "image/webp",
        "Content-Disposition": 'attachment; filename="quote-attachment.webp"',
        "Cache-Control": "private, no-store",
      },
    });
  } catch (e) {
    return apiError(e);
  }
}
