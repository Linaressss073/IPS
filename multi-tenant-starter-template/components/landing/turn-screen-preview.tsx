import { BellRing, Volume2 } from "lucide-react";

/** Illustrative data only (no real patients). */
const RECENT = [
  { turn: "MG 12", place: "Consultorio 301", status: "atendiendo" },
  { turn: "VAC 7", place: "Vacunación 101", status: "atendiendo" },
  { turn: "RTH 3", place: "Consultorio 502", status: "no se presentó" },
  { turn: "FAR 21", place: "Farmacia 1", status: "atendiendo" },
];

/**
 * Preview of the waiting-room screen planned for admission: the current
 * call in large type and the latest calls on the side.
 */
export function TurnScreenPreview() {
  return (
    <figure
      className="relative overflow-hidden rounded-2xl border bg-card shadow-xl shadow-primary/5"
      aria-label="Vista previa de la pantalla de llamado de turnos"
    >
      <div className="flex items-center justify-between border-b bg-muted/40 px-4 py-2 text-xs text-muted-foreground">
        <span className="font-medium">Sala de espera · Consulta externa</span>
        <span className="tabular-nums">07:40</span>
      </div>

      <div className="grid gap-0 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <ul className="order-2 divide-y border-t sm:order-1 sm:border-r sm:border-t-0">
          <li className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Últimos llamados
          </li>
          {RECENT.map((call) => {
            const missed = call.status === "no se presentó";
            return (
              <li key={call.turn} className="flex items-center justify-between gap-2 px-4 py-2.5">
                <div className="min-w-0">
                  <p className="font-semibold tabular-nums">{call.turn}</p>
                  <p className="truncate text-xs text-muted-foreground">{call.place}</p>
                </div>
                <span
                  className={
                    missed
                      ? "shrink-0 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-medium text-destructive"
                      : "shrink-0 rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-accent-foreground"
                  }
                >
                  {call.status}
                </span>
              </li>
            );
          })}
        </ul>

        <div className="order-1 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-primary/10 via-transparent to-trust/10 px-6 py-8 text-center sm:order-2 sm:py-10">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
            <BellRing className="h-3.5 w-3.5 motion-safe:animate-pulse" aria-hidden />
            Llamando
          </span>
          <p className="text-5xl font-bold tracking-tight tabular-nums sm:text-6xl">RTH 4</p>
          <p className="text-lg font-medium text-trust">Consultorio 502</p>
          <p className="text-sm text-muted-foreground">Andrés G. · Rehabilitación</p>
          <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Volume2 className="h-3.5 w-3.5" aria-hidden />
            Llamado 1 de 3 · se repite cada 2 min
          </p>
        </div>
      </div>
    </figure>
  );
}
