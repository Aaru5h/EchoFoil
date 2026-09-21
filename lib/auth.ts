import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { compare } from "bcryptjs";
import { z } from "zod";
import { db } from "./db";
import { rateLimit } from "./ratelimit";
const dummyHash = "$2a$12$wRb6vZu53NRHeAe.Yod8YuqfJlfdltBk.4fMBblVGpNDjZQvgPZsa";
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 },
  trustHost: true,
  pages: { signIn: "/sq/login" },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const parsed = z
          .object({
            email: z
              .string()
              .email()
              .transform((v) => v.toLowerCase()),
            password: z.string().min(1).max(72),
          })
          .safeParse(raw);
        if (!parsed.success || !process.env.DATABASE_URL) return null;
        try {
          await rateLimit(`login:${parsed.data.email}`, 5);
        } catch {
          return null;
        }
        const user = await db.user.findUnique({ where: { email: parsed.data.email } });
        const valid = await compare(parsed.data.password, user?.passwordHash ?? dummyHash);
        if (!valid || !user?.passwordHash) return null;
        return { id: user.id, name: user.name, email: user.email, image: user.image };
      },
    }),
    ...(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
      ? [
          Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        const record = await db.user.findUnique({ where: { id: user.id } });
        token.version = record?.sessionVersion ?? 0;
        token.authTime = Date.now();
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) session.user.id = String(token.id ?? token.sub);
      session.authVersion = Number(token.version ?? 0);
      session.authTime = Number(token.authTime ?? 0);
      return session;
    },
  },
});
