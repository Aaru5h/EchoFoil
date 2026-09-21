import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import sharp from "sharp";
import { randomUUID } from "node:crypto";
import { protectRequest, apiError } from "@/lib/http";
import { uploadReceipt } from "@/lib/upload-receipt";
import { verifyHuman } from "@/lib/turnstile";
export async function POST(req: Request) {
  try {
    await protectRequest(req, "quote-upload");
    if (!process.env.BLOB_PRIVATE_READ_WRITE_TOKEN) throw new Error("SERVICE_UNAVAILABLE");
    const data = await req.formData();
    await verifyHuman(String(data.get("turnstileToken") || ""), String(data.get("website") || ""));
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
    const blob = await put(`quotes/${randomUUID()}.webp`, buffer, {
      access: "private",
      token: process.env.BLOB_PRIVATE_READ_WRITE_TOKEN,
      contentType: "image/webp",
      addRandomSuffix: true,
    });
    return NextResponse.json({ url: blob.url, receipt: uploadReceipt(blob.url) });
  } catch (e) {
    return apiError(e);
  }
}
