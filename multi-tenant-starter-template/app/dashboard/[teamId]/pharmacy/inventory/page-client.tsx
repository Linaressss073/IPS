"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, History, PackagePlus, Plus, SlidersHorizontal } from "lucide-react";
import { NoPermission, useAccess } from "@/components/access/access-context";
import { PageHeader, PageShell } from "@/components/page-header";
import { errorMessage } from "@/components/patients/error-message";
import { Field, Select } from "@/components/patients/form-controls";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  adjustLot,
  createProduct,
  listMovements,
  listProducts,
  LOT_STATUSES,
  LotStatus,
  Movement,
  Product,
  receiveLot,
  STOCK_ALERTS,
  StockAlert,
  updateProduct,
} from "@/lib/api/pharmacy";
import { colombiaToday } from "@/lib/api/scheduling";
import { useApiAuth } from "@/lib/api/use-api-auth";
import { cn } from "@/lib/utils";

const ALERT_STYLES: Record<StockAlert, string> = {
  stock_bajo: "bg-trust/10 text-trust",
  por_vencer: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  vencido: "bg-destructive/10 text-destructive",
};

const LOT_STYLES: Record<LotStatus, string> = {
  vigente: "text-muted-foreground",
  por_vencer: "text-amber-700 dark:text-amber-300",
  vencido: "text-destructive",
};

/** Inventario: catalog, lots with expiry (FEFO), receipts, adjustments and kardex. */
export function PageClient() {
  const { teamId } = useParams<{ teamId: string }>();
  const auth = useApiAuth();
  const { access, can } = useAccess();
  const allowed = can("pharmacy:dispense");
  const [state, setState] = React.useState<{ loading: true } | { loading: false; products: Product[] }>({ loading: true });
  const [filter, setFilter] = React.useState<StockAlert | "todos">("todos");
  const [search, setSearch] = React.useState("");
  const [creating, setCreating] = React.useState(false);
  const [error, setError] = React.useState("");

  const load = React.useCallback(async () => {
    try {
      setState({ loading: false, products: await listProducts(auth, teamId) });
      setError("");
    } catch (e) {
      setError(errorMessage(e));
    }
  }, [auth, teamId]);

  React.useEffect(() => {
    if (allowed) void load();
  }, [allowed, load]);

  if (access && !allowed) return <NoPermission what="gestionar el inventario de farmacia" />;

  const products = state.loading ? [] : state.products;
  const replace = (updated: Product) =>
    setState({ loading: false, products: products.map((p) => (p.id === updated.id ? updated : p)) });
  const count = (alert: StockAlert) => products.filter((p) => p.alerts.includes(alert)).length;
  const words = search.toLowerCase().split(" ").filter(Boolean);
  const visible = products.filter(
    (p) =>
      (filter === "todos" || p.alerts.includes(filter)) && words.every((word) => p.label.toLowerCase().includes(word)),
  );

  return (
    <PageShell>
      <PageHeader
        eyebrow="Farmacia"
        title="Inventario"
        description="Medicamentos por lote y vencimiento. Al entregar, sale primero lo que vence primero; los lotes vencidos no se dispensan."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/dashboard/${teamId}/pharmacy`}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Fórmulas
              </Link>
            </Button>
            <Button onClick={() => setCreating((c) => !c)}>
              <Plus className="mr-2 h-4 w-4" /> Nuevo producto
            </Button>
          </div>
        }
      />

      {creating && (
        <NewProductForm
          onCreate={async (input) => {
            const created = await createProduct(auth, teamId, input);
            setState({ loading: false, products: [...products, created].sort((a, b) => a.label.localeCompare(b.label)) });
            setCreating(false);
          }}
          onCancel={() => setCreating(false)}
        />
      )}

      <div className="flex flex-wrap items-center gap-2">
        {(["todos", "stock_bajo", "por_vencer", "vencido"] as const).map((value) => (
          <Button
            key={value}
            size="sm"
            variant={filter === value ? "default" : "outline"}
            onClick={() => setFilter(value)}
          >
            {value === "todos" ? `Todos (${products.length})` : `${STOCK_ALERTS[value]} (${count(value)})`}
          </Button>
        ))}
        <Input className="max-w-xs" placeholder="Buscar medicamento" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      {error && <p className="rounded-md border border-destructive/50 px-3 py-2 text-sm text-destructive">{error}</p>}

      {state.loading ? (
        <Skeleton className="h-40 w-full" />
      ) : visible.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {products.length === 0 ? "Aún no hay productos: crea el primero y recibe un lote." : "Ningún producto con ese filtro."}
        </p>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {visible.map((product) => (
            <ProductCard key={product.id} product={product} teamId={teamId} onChange={replace} />
          ))}
        </div>
      )}
    </PageShell>
  );
}

function NewProductForm(props: {
  onCreate: (input: { name: string; presentation: string; minStock: number }) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = React.useState("");
  const [presentation, setPresentation] = React.useState("Tableta");
  const [minStock, setMinStock] = React.useState("10");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");

  return (
    <Card>
      <CardContent className="space-y-3 pt-6">
        <div className="grid gap-3 md:grid-cols-3">
          <Field label="Medicamento y concentración" id="product-name">
            <Input id="product-name" placeholder="Acetaminofén 500 mg" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Presentación" id="product-presentation">
            <Input id="product-presentation" value={presentation} onChange={(e) => setPresentation(e.target.value)} />
          </Field>
          <Field label="Stock mínimo" id="product-min">
            <Input id="product-min" type="number" min={0} value={minStock} onChange={(e) => setMinStock(e.target.value)} />
          </Field>
        </div>
        <p className="text-xs text-muted-foreground">
          Usa el mismo nombre que escribe el médico en la fórmula: así se preselecciona al entregar.
        </p>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex gap-2">
          <Button
            size="sm"
            disabled={busy || !name.trim()}
            onClick={async () => {
              setBusy(true);
              setError("");
              try {
                await props.onCreate({ name, presentation, minStock: Number(minStock) });
              } catch (e) {
                setError(errorMessage(e));
              } finally {
                setBusy(false);
              }
            }}
          >
            Crear producto
          </Button>
          <Button size="sm" variant="ghost" onClick={props.onCancel}>
            Cancelar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

type Panel = "none" | "receive" | "adjust" | "kardex";

function ProductCard(props: { product: Product; teamId: string; onChange: (product: Product) => void }) {
  const { product: p, teamId } = props;
  const auth = useApiAuth();
  const [panel, setPanel] = React.useState<Panel>("none");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");
  const toggle = (next: Panel) => setPanel((current) => (current === next ? "none" : next));

  const run = async (action: () => Promise<Product>) => {
    setBusy(true);
    setError("");
    try {
      props.onChange(await action());
      setPanel("none");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className={cn(!p.active && "opacity-70")}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div className="min-w-0 space-y-1">
          <CardTitle className="truncate text-base">{p.name}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {p.presentation} · mínimo {p.minStock}
            {!p.active && " · inactivo"}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-2xl font-semibold tabular-nums">{p.available}</p>
          <p className="text-xs text-muted-foreground">disponibles</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {p.alerts.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {p.alerts.map((alert) => (
              <span key={alert} className={cn("rounded-full px-2 py-0.5 text-xs font-medium", ALERT_STYLES[alert])}>
                {STOCK_ALERTS[alert]}
                {alert === "vencido" && ` · ${p.expired} u.`}
              </span>
            ))}
          </div>
        )}

        {p.lots.length > 0 ? (
          <ul className="divide-y rounded-md border text-sm">
            {p.lots.map((lot) => (
              <li key={lot.lotNumber} className="flex items-center justify-between gap-2 px-3 py-2">
                <span className="font-mono text-xs">{lot.lotNumber}</span>
                <span className={cn("text-xs", LOT_STYLES[lot.status])}>
                  vence {lot.expiresOn} · {LOT_STATUSES[lot.status]}
                </span>
                <span className="tabular-nums">{lot.quantity}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Sin existencias.</p>
        )}

        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant={panel === "receive" ? "default" : "outline"} onClick={() => toggle("receive")}>
            <PackagePlus className="mr-1.5 h-4 w-4" /> Recibir lote
          </Button>
          <Button
            size="sm"
            variant={panel === "adjust" ? "default" : "outline"}
            disabled={p.lots.length === 0}
            onClick={() => toggle("adjust")}
          >
            <SlidersHorizontal className="mr-1.5 h-4 w-4" /> Ajustar
          </Button>
          <Button size="sm" variant={panel === "kardex" ? "default" : "outline"} onClick={() => toggle("kardex")}>
            <History className="mr-1.5 h-4 w-4" /> Kárdex
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={busy}
            onClick={() => run(() => updateProduct(auth, teamId, p.id, { active: !p.active }))}
          >
            {p.active ? "Desactivar" : "Activar"}
          </Button>
        </div>

        {panel === "receive" && (
          <ReceiveForm busy={busy} onSubmit={(input) => run(() => receiveLot(auth, teamId, p.id, input))} />
        )}
        {panel === "adjust" && (
          <AdjustForm product={p} busy={busy} onSubmit={(input) => run(() => adjustLot(auth, teamId, p.id, input))} />
        )}
        {panel === "kardex" && <Kardex teamId={teamId} productId={p.id} />}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}

function ReceiveForm(props: {
  busy: boolean;
  onSubmit: (input: { lotNumber: string; expiresOn: string; quantity: number; supplier: string }) => void;
}) {
  const [lotNumber, setLotNumber] = React.useState("");
  const [expiresOn, setExpiresOn] = React.useState("");
  const [quantity, setQuantity] = React.useState("");
  const [supplier, setSupplier] = React.useState("");

  return (
    <div className="space-y-2 rounded-md border p-3">
      <div className="grid gap-2 sm:grid-cols-2">
        <Input placeholder="Lote (p. ej. A23-0912)" value={lotNumber} onChange={(e) => setLotNumber(e.target.value)} />
        <Input
          type="date"
          aria-label="Vencimiento"
          min={colombiaToday()}
          value={expiresOn}
          onChange={(e) => setExpiresOn(e.target.value)}
        />
        <Input type="number" min={1} placeholder="Unidades" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        <Input placeholder="Proveedor (opcional)" value={supplier} onChange={(e) => setSupplier(e.target.value)} />
      </div>
      <Button
        size="sm"
        disabled={props.busy || !lotNumber.trim() || !expiresOn || Number(quantity) < 1}
        onClick={() => props.onSubmit({ lotNumber, expiresOn, quantity: Number(quantity), supplier })}
      >
        Registrar entrada
      </Button>
    </div>
  );
}

function AdjustForm(props: {
  product: Product;
  busy: boolean;
  onSubmit: (input: { lotNumber: string; quantity: number; reason: string }) => void;
}) {
  const [lotNumber, setLotNumber] = React.useState(
    props.product.lots.find((lot) => lot.status === "vencido")?.lotNumber ?? props.product.lots[0].lotNumber,
  );
  const [direction, setDirection] = React.useState<"baja" | "alta">("baja");
  const [quantity, setQuantity] = React.useState("");
  const [reason, setReason] = React.useState("");

  return (
    <div className="space-y-2 rounded-md border p-3">
      <div className="grid gap-2 sm:grid-cols-3">
        <Select aria-label="Lote" value={lotNumber} onChange={(e) => setLotNumber(e.target.value)}>
          {props.product.lots.map((lot) => (
            <option key={lot.lotNumber} value={lot.lotNumber}>
              {lot.lotNumber} ({lot.quantity})
            </option>
          ))}
        </Select>
        <Select aria-label="Tipo de ajuste" value={direction} onChange={(e) => setDirection(e.target.value as "baja" | "alta")}>
          <option value="baja">Dar de baja</option>
          <option value="alta">Sumar (conteo)</option>
        </Select>
        <Input type="number" min={1} placeholder="Unidades" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
      </div>
      <Input
        placeholder="Motivo (vencido, dañado, conteo físico…)"
        maxLength={200}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />
      <Button
        size="sm"
        disabled={props.busy || Number(quantity) < 1 || reason.trim().length < 3}
        onClick={() =>
          props.onSubmit({ lotNumber, quantity: (direction === "baja" ? -1 : 1) * Number(quantity), reason })
        }
      >
        Registrar ajuste
      </Button>
    </div>
  );
}

const MOVEMENT_LABELS: Record<Movement["type"], string> = { entrada: "Entrada", salida: "Salida", ajuste: "Ajuste" };

function describe(reference: Movement["reference"]): string {
  switch (reference.kind) {
    case "recepcion":
      return reference.supplier ? `Proveedor: ${reference.supplier}` : "Recepción";
    case "dispensacion":
      return "Entrega de fórmula";
    case "ajuste":
      return reference.reason;
  }
}

function Kardex(props: { teamId: string; productId: string }) {
  const auth = useApiAuth();
  const [state, setState] = React.useState<{ loading: true } | { loading: false; movements: Movement[] }>({
    loading: true,
  });
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    listMovements(auth, props.teamId, props.productId)
      .then((movements) => setState({ loading: false, movements }))
      .catch((e) => setError(errorMessage(e)));
  }, [auth, props.teamId, props.productId]);

  if (error) return <p className="text-sm text-destructive">{error}</p>;
  if (state.loading) return <Skeleton className="h-20 w-full" />;
  if (state.movements.length === 0) return <p className="text-sm text-muted-foreground">Sin movimientos.</p>;
  return (
    <div className="max-h-72 overflow-y-auto rounded-md border">
      <table className="w-full text-xs">
        <thead className="sticky top-0 bg-muted text-left">
          <tr>
            <th className="px-2 py-1.5 font-medium">Fecha</th>
            <th className="px-2 py-1.5 font-medium">Movimiento</th>
            <th className="px-2 py-1.5 font-medium">Lote</th>
            <th className="px-2 py-1.5 text-right font-medium">Unid.</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {state.movements.map((m) => (
            <tr key={m.id}>
              <td className="whitespace-nowrap px-2 py-1.5 text-muted-foreground">
                {new Date(m.at).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" })}
              </td>
              <td className="px-2 py-1.5">
                {MOVEMENT_LABELS[m.type]} · <span className="text-muted-foreground">{describe(m.reference)}</span>
                <span className="block text-muted-foreground">{m.byName || m.by}</span>
              </td>
              <td className="px-2 py-1.5 font-mono">{m.lotNumber}</td>
              <td className={cn("px-2 py-1.5 text-right tabular-nums", m.quantity < 0 ? "text-destructive" : "text-primary")}>
                {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
