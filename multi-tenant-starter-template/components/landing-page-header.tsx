"use client";

import { useAuth } from "@clerk/nextjs";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { cn } from "@/lib/utils";
import { ColorModeSwitcher } from "./color-mode-switcher";
import { Logo } from "./logo";
import { Button, buttonVariants } from "./ui/button";

type NavItem = { title: string; href: string };

function AuthButtons(props: { stacked?: boolean }) {
  const { isLoaded, isSignedIn } = useAuth();
  const size = props.stacked ? "default" : "sm";

  if (isLoaded && isSignedIn) {
    return (
      <Link href="/dashboard" className={buttonVariants({ size })}>
        Ir al panel
      </Link>
    );
  }
  return (
    <>
      <Link href="/sign-in" className={buttonVariants({ variant: "ghost", size })}>
        Iniciar sesión
      </Link>
      <Link href="/sign-up" className={buttonVariants({ size })}>
        Crear cuenta
      </Link>
    </>
  );
}

export function LandingPageHeader(props: { items: NavItem[] }) {
  const [open, setOpen] = React.useState(false);

  // Close the mobile menu on Escape.
  React.useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="container flex h-16 items-center justify-between gap-4 px-4 md:px-8">
        <Logo />

        <nav className="hidden items-center gap-6 md:flex" aria-label="Secciones">
          {props.items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-foreground/70 transition-colors hover:text-foreground"
            >
              {item.title}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1 md:gap-2">
          <ColorModeSwitcher />
          <div className="hidden items-center gap-2 md:flex">
            <AuthButtons />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      <div className={cn("border-t bg-background md:hidden", open ? "block" : "hidden")}>
        <nav className="container flex flex-col gap-1 px-4 py-4" aria-label="Secciones">
          {props.items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="rounded-md px-2 py-2 text-sm font-medium hover:bg-muted"
            >
              {item.title}
            </Link>
          ))}
          <div className="mt-3 grid gap-2">
            <AuthButtons stacked />
          </div>
        </nav>
      </div>
    </header>
  );
}
