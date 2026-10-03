"use client";

import { SignUp } from "@clerk/nextjs";
import { AuthShell } from "@/components/auth-shell";
import { useClerkAppearance } from "@/lib/clerk-appearance";

export default function SignUpPage() {
  const appearance = useClerkAppearance();
  return (
    <AuthShell title="Crea tu cuenta" subtitle="Luego creas tu IPS o aceptas la invitación de tu equipo.">
      <SignUp appearance={appearance} />
    </AuthShell>
  );
}
