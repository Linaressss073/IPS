import { TURN_STATUSES, TurnStatus } from "@/lib/api/admission";
import { cn } from "@/lib/utils";

/** Green while it moves, blue when called, red only for a no-show. */
const STYLES: Record<TurnStatus, string> = {
  en_espera: "bg-muted text-foreground",
  anunciado: "bg-trust/10 text-trust",
  atendido: "bg-accent text-accent-foreground",
  no_se_presento: "bg-destructive/10 text-destructive",
};

export function TurnStatusBadge(props: { status: TurnStatus; calls?: number }) {
  return (
    <span className={cn("whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium", STYLES[props.status])}>
      {TURN_STATUSES[props.status]}
      {props.status === "anunciado" && props.calls ? ` · ${props.calls}` : ""}
    </span>
  );
}
