import { NextResponse } from "next/server";
import { protectRequest, apiError } from "@/lib/http";
import { adminAction } from "@/lib/admin";
export async function POST(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    await protectRequest(req, "admin");
    const { path } = await params;
    return NextResponse.json(await adminAction(path.join("/"), await req.json()));
  } catch (e) {
    return apiError(e);
  }
}
