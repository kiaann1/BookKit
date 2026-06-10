import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { UserRole } from "@prisma/client";
import { compare } from "bcryptjs";
import { isBootstrapAdminEmail } from "@/lib/auth/bootstrap-admins";
import { prisma } from "@/lib/db";
import { loginSchema } from "@/lib/validations/auth";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email.toLowerCase() },
        });

        if (!user?.passwordHash) {
          return null;
        }

        const isValid = await compare(parsed.data.password, user.passwordHash);
        if (!isValid) {
          return null;
        }

        let role = user.role;
        if (isBootstrapAdminEmail(user.email) && role !== UserRole.ADMIN) {
          await prisma.user.update({
            where: { id: user.id },
            data: { role: UserRole.ADMIN },
          });
          role = UserRole.ADMIN;
        }

        return {
          id: user.id,
          email: user.email,
          name:
            user.name ??
            (`${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.username),
          image: user.avatarUrl,
          username: user.username,
          role,
          onboardingCompleted: Boolean(user.onboardingCompletedAt),
        };
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user, trigger, session }) => {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.role = user.role;
        token.onboardingCompleted = user.onboardingCompleted ?? false;
      }

      if (token.id && typeof token.id === "string") {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id },
            select: {
              role: true,
              username: true,
              onboardingCompletedAt: true,
            },
          });
          if (dbUser) {
            token.role = dbUser.role;
            token.username = dbUser.username;
            token.onboardingCompleted = Boolean(dbUser.onboardingCompletedAt);
          }
        } catch {
          // Keep existing token claims if the database is unreachable.
        }
      }

      if (trigger === "update") {
        if (session?.onboardingCompleted !== undefined) {
          token.onboardingCompleted = Boolean(session.onboardingCompleted);
        }
        if (typeof session?.username === "string") {
          token.username = session.username;
        }
      }

      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.role = token.role as typeof session.user.role;
        session.user.onboardingCompleted = Boolean(token.onboardingCompleted);
      }
      return session;
    },
  },
});
