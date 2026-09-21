import { NextResponse } from "next/server";
import { put, list, del } from "@vercel/blob";
import sharp from "sharp";
import { randomUUID } from "node:crypto";
import { apiAdmin } from "@/lib/auth/guards";
import { apiError, protectRequest } from "@/lib/http";
export async function POST(req: Request) {
  try {
    await apiAdmin();
    await protectRequest(req, "media");
    if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error("SERVICE_UNAVAILABLE");
    const data = await req.formData();
    const file = data.get("file");
    if (
      !(file instanceof File) ||
      file.size > 5_000_000 ||
      !["image/jpeg", "image/png", "image/webp"].includes(file.type)
    )
      throw new Error("INVALID_REQUEST");
    const buffer = await sharp(Buffer.from(await file.arrayBuffer()), {
      limitInputPixels: 20_000_000,
    })
      .rotate()
      .resize({ width: 1800, height: 1800, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();
    const blob = await put(`products/${randomUUID()}.webp`, buffer, {
      access: "public",
      contentType: "image/webp",
      addRandomSuffix: true,
    });
    return NextResponse.json({ url: blob.url });
  } catch (e) {
    return apiError(e);
  }
}
export async function GET() {
  try {
    await apiAdmin();
    if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error("SERVICE_UNAVAILABLE");
    return NextResponse.json(await list({ prefix: "products/", limit: 100 }));
  } catch (e) {
    return apiError(e);
  }
}
export async function DELETE(req: Request) {
  try {
    await apiAdmin();
    await protectRequest(req, "media-delete");
    const { url } = await req.json();
    if (
      typeof url !== "string" ||
      !/^https:\/\/[^/]+\.public\.blob\.vercel-storage\.com\/products\//.test(url)
    )
      throw new Error("INVALID_REQUEST");
    await del(url);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
