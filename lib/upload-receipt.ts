import { createHmac, timingSafeEqual } from "node:crypto";
function signature(payload: string) {
  if (!process.env.AUTH_SECRET) throw new Error("SERVICE_UNAVAILABLE");
  return createHmac("sha256", process.env.AUTH_SECRET).update(payload).digest("hex");
}
export function uploadReceipt(url: string) {
  const payload = Buffer.from(JSON.stringify({ url, expires: Date.now() + 10 * 60_000 })).toString(
    "base64url",
  );
  return `${payload}.${signature(payload)}`;
}
export function verifyUploadReceipt(url: string, receipt: string) {
  const [payload, sig] = receipt.split(".");
  if (!payload || !sig) throw new Error("INVALID_REQUEST");
  const expected = signature(payload);
  if (sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected)))
    throw new Error("INVALID_REQUEST");
  const data = JSON.parse(Buffer.from(payload, "base64url").toString());
  if (data.url !== url || data.expires < Date.now()) throw new Error("INVALID_REQUEST");
}
