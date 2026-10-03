import { HeartPulse } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/** Brand: a green pulse (life, care) and the product name. */
export function Logo(props: { className?: string; link?: string }) {
  return (
    <Link
      href={props.link ?? "/"}
      className={cn("flex items-center gap-2 font-semibold tracking-tight", props.className)}
      aria-label="IPS Consulta Externa, inicio"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
        <HeartPulse className="h-5 w-5" aria-hidden />
      </span>
      <span className="leading-tight">
        IPS <span className="text-primary">Consulta Externa</span>
      </span>
    </Link>
  );
}
