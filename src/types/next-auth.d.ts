import { type DefaultSession } from "next-auth";
import { type UserRole } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      role: UserRole;
      onboardingCompleted: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    username?: string;
    role?: UserRole;
    onboardingCompleted?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    username?: string;
    role?: UserRole;
    onboardingCompleted?: boolean;
  }
}
