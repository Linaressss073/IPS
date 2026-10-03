"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { BellRing, PackageCheck, RefreshCw } from "lucide-react";
import { NoPermission, useAccess } from "@/components/access/access-context";
import { PageHeader, PageShell } from "@/components/page-header";
import { errorMessage } from "@/components/patients/error-message";
import { Select } from "@/components/patients/form-controls";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES } from "@/lib/api/consultation";
import {
  deliver,
  DISPENSATION_STATUSES,
  DispensationStatus,
  issuePharmacyTurn,
  listPrescriptions,
  PharmacyPrescription,
} from "@/lib/api/pharmacy";
import { colombiaToday, listLocations, Location } from "@/lib/api/scheduling";
import { useApiAuth } from "@/lib/api/use-api-auth";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<DispensationStatus, string> = {
  pendiente: "bg-muted text-foreground",
  parcial: "bg-trust/10 text-trust",
  completa: "bg-accent text-accent-foreground",
};

/** Farmacia: the day's signed prescriptions; give a turn and deliver (all or part). */
export function PageClient() {
  const { teamId } = useParams<{ teamId: string }>();
  const auth = useApiAuth();
  const { access, can } = useAccess();
  const allowed = can("pharmacy:dispense");
  const [date, setDate] = React.useState(colombiaToday());
  const [status, setStatus] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [state, setState] = React.useState<{ loading: true } | { loading: false; items: PharmacyPrescription[] }>({
    loading: true,
  });
  const [windows, setWindows] = React.useState<Location[]>([]);
  const [error, setError] = React.useState("");

  const load = React.useCallback(async () => {
    try {
      setState({ loading: false, items: await listPrescriptions(auth, teamId, { date, status }) });
      setError("");
    } catch (e) {
      setError(errorMessage(e));
    }
  }, [auth, teamId, date, status]);

  React.useEffect(() => {
    if (!allowed) return;
    void load();
    listLocations(auth, teamId)
      .then((all) => setWindows(all.filter((location) => location.active)))
      .catch(() => setWindows([]));
  }, [allowed, load, auth, teamId]);

  if (access && !allowed) return <NoPermission what="dispensar medicamentos" />;

  const words = search.toLowerCase().split(" ").filter(Boolean);
  const visible = state.loading
    ? []
    : state.items.filter((p) => {
        const text = `${p.patient.fullName} ${p.patient.document.number}`.toLowerCase();
        return words.every((word) => text.includes(word));
      });

  return (
    <PageShell>
      <PageHeader
        eyebrow="Farmacia"
        title="Fórmulas por dispensar"
        description="Fórmulas médicas firmadas: llama al paciente a la ventanilla y entrega todo o parte; lo que falte queda pendiente."
        actions={
          <Button variant="outline" onClick={() => void load()}>
            <RefreshCw className="mr-2 h-4 w-4" /> Actualizar
          </Button>
        }
      />
      <div className="flex flex-wrap gap-2">
        <Input type="date" className="w-40" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
        <Select className="w-48" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Todos los estados</option>
          {Object.entries(DISPENSATION_STATUSES).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <Input className="max-w-xs" placeholder="Paciente o documento" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      {error && <p className="rounded-md border border-destructive/50 px-3 py-2 text-sm text-destructive">{error}</p>}

      {state.loading ? (
        <Skeleton className="h-40 w-full" />
      ) : visible.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay fórmulas firmadas para ese día{search && " con ese paciente"}.</p>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {visible.map((prescription) => (
            <PrescriptionCard
              key={prescription.consultationId}
              prescription={prescription}
              windows={windows}
              onDeliver={async (lines, note) => {
                await deliver(auth, teamId, prescription, lines, note);
                await load();
              }}
              onTurn={async (windowId) => {
                const turn = await issuePharmacyTurn(auth, teamId, prescription.consultationId, windowId);
                return `${turn.label} · ${turn.location.label}`;
              }}
            />
          ))}
        </div>
      )}
    </PageShell>
  );
}

function PrescriptionCard(props: {
  prescription: PharmacyPrescription;
  windows: Location[];
  onDeliver: (lines: { index: number; quantity: number }[], note: string) => Promise<void>;
  onTurn: (windowId: string) => Promise<string>;
}) {
  const { prescription: p } = props;
  const [delivering, setDelivering] = React.useState(false);
  const [quantities, setQuantities] = React.useState<Record<number, string>>({});
  const [note, setNote] = React.useState("");
  const [windowId, setWindowId] = React.useState("");
  const [turn, setTurn] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");
  const pending = p.items.filter((item) => item.pending > 0);

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div className="min-w-0 space-y-1">
          <CardTitle className="truncate text-base">{p.patient.fullName || "Paciente"}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {p.patient.document.type} {p.patient.document.number} · Dr(a). {p.physician.displayName || p.physician.userId}
          </p>
        </div>
        <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-xs font-medium", STATUS_STYLES[p.status])}>
          {DISPENSATION_STATUSES[p.status]}
        </span>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="divide-y rounded-md border text-sm">
          {p.items.map((item) => (
            <li key={item.index} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="font-medium">
                  {item.medication} <span className="text-muted-foreground">· {item.presentation}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {item.dose} {ROUTES[item.route]?.toLowerCase()} {item.frequency.toLowerCase()} por {item.durationDays} días
                  {item.instructions && ` · ${item.instructions}`}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-xs tabular-nums text-muted-foreground">
                  {item.delivered}/{item.prescribed} entregadas
                </span>
                {delivering && item.pending > 0 && (
                  <Input
                    type="number"
                    className="w-20"
                    min={0}
                    max={item.pending}
                    aria-label={`Entregar de ${item.medication}`}
                    value={quantities[item.index] ?? String(item.pending)}
                    onChange={(e) => setQuantities((q) => ({ ...q, [item.index]: e.target.value }))}
                  />
                )}
              </div>
            </li>
          ))}
        </ul>

        {p.deliveries.length > 0 && (
          <details className="text-sm">
            <summary className="cursor-pointer text-muted-foreground">Entregas ({p.deliveries.length})</summary>
            <ul className="mt-2 space-y-1">
              {p.deliveries.map((d, index) => (
                <li key={index} className="text-xs text-muted-foreground">
                  {new Date(d.at).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" })} ·{" "}
                  {d.byName || d.by}: {d.lines.map((line) => `${line.quantity} ${line.medication}`).join(", ")}
                  {d.note && ` · ${d.note}`}
                </li>
              ))}
            </ul>
          </details>
        )}

        {pending.length > 0 && (
          <div className="space-y-3">
            {delivering ? (
              <div className="space-y-2">
                <Input placeholder="Nota (p. ej. faltan existencias)" maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} />
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    disabled={busy}
                    onClick={() =>
                      run(async () => {
                        const lines = pending
                          .map((item) => ({ index: item.index, quantity: Number(quantities[item.index] ?? item.pending) }))
                          .filter((line) => line.quantity > 0);
                        await props.onDeliver(lines, note);
                        setDelivering(false);
                        setQuantities({});
                        setNote("");
                      })
                    }
                  >
                    <PackageCheck className="mr-1.5 h-4 w-4" /> Confirmar entrega
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setDelivering(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" onClick={() => setDelivering(true)}>
                  <PackageCheck className="mr-1.5 h-4 w-4" /> Entregar
                </Button>
                <Select className="w-44" value={windowId} onChange={(e) => setWindowId(e.target.value)} aria-label="Ventanilla">
                  <option value="">Ventanilla…</option>
                  {props.windows.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.label}
                    </option>
                  ))}
                </Select>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy || !windowId}
                  onClick={() => run(async () => setTurn(await props.onTurn(windowId)))}
                >
                  <BellRing className="mr-1.5 h-4 w-4" /> Dar turno
                </Button>
              </div>
            )}
            {turn && <p className="text-sm text-primary">Turno {turn}. Llámalo desde Turnos.</p>}
          </div>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
