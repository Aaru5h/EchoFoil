import { auth } from "../auth";
import { db } from "../db";
import { redirect } from "next/navigation";
export async function currentUser() {
  const session = await auth();
  if (!session?.user?.id || !process.env.DATABASE_URL) return null;
  const user = await db.user.findUnique({ where: { id: session.user.id } });
  return user && session.authVersion === user.sessionVersion ? user : null;
}
export async function requireUser(locale = "sq") {
  const user = await currentUser();
  if (!user) redirect(`/${locale}/login`);
  return user;
}
export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/sq/account");
  return user;
}
export async function apiUser() {
  const user = await currentUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}
export async function apiAdmin() {
  const user = await apiUser();
  if (user.role !== "ADMIN") throw new Error("FORBIDDEN");
  return user;
}
