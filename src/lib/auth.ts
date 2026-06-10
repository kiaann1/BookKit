import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
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

        return {
          id: user.id,
          email: user.email,
          name:
            user.name ??
            (`${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.username),
          image: user.avatarUrl,
          username: user.username,
          role: user.role,
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

      if (trigger === "update" && session?.onboardingCompleted !== undefined) {
        token.onboardingCompleted = Boolean(session.onboardingCompleted);
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
