import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";
import { redirectIfAuthenticated } from "@/lib/auth/redirects";

export const metadata: Metadata = {
  title: "Create account",
};

export default async function RegisterPage() {
  await redirectIfAuthenticated();

  return <RegisterForm />;
}
