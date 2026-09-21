import { NextResponse } from "next/server";
import { customerAction } from "@/lib/api-actions";
import { protectRequest, apiError } from "@/lib/http";
import { apiUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
export async function POST(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    const { path } = await params;
    const action = path.join("/");
    await protectRequest(req, action);
    return NextResponse.json(await customerAction(action, await req.json()));
  } catch (error) {
    return apiError(error);
  }
}
export async function GET(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    const { path } = await params;
    const action = path.join("/");
    if (action === "health") {
      if (!process.env.DATABASE_URL)
        return NextResponse.json({ status: "preview", database: "not configured" });
      await db.$queryRaw`SELECT 1`;
      return NextResponse.json({ status: "ok" });
    }
    const user = await apiUser();
    if (action === "me")
      return NextResponse.json({
        id: user.id,
        name: user.name,
        email: user.email,
        addresses: await db.address.findMany({ where: { userId: user.id } }),
        wishlist: await db.wishlistItem.findMany({ where: { userId: user.id } }),
      });
    if (action === "export") {
      const { passwordHash, ...safe } = user;
      void passwordHash;
      return NextResponse.json(
        {
          user: safe,
          addresses: await db.address.findMany({ where: { userId: user.id } }),
          orders: await db.order.findMany({ where: { userId: user.id }, include: { items: true } }),
          quotes: await db.quoteRequest.findMany({ where: { userId: user.id } }),
          reviews: await db.review.findMany({ where: { userId: user.id } }),
          wishlist: await db.wishlistItem.findMany({ where: { userId: user.id } }),
        },
        {
          headers: {
            "Content-Disposition": 'attachment; filename="echofoil-data.json"',
            "Cache-Control": "no-store",
          },
        },
      );
    }
    throw new Error("NOT_FOUND");
  } catch (error) {
    return apiError(error);
  }
}
