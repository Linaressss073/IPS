"use client";

import { SignIn } from "@clerk/nextjs";
import { AuthShell } from "@/components/auth-shell";
import { useClerkAppearance } from "@/lib/clerk-appearance";

export default function SignInPage() {
  const appearance = useClerkAppearance();
  return (
    <AuthShell title="Bienvenido de nuevo" subtitle="Inicia sesión para entrar a tu IPS.">
      <SignIn appearance={appearance} />
    </AuthShell>
  );
}
