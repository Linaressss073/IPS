"use client";

import * as React from "react";
import Link from "next/link";
import { useUser } from "@hexclave/next";
import { ChevronLeft, ChevronRight, Search, UserPlus } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { errorMessage } from "@/components/patients/error-message";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ageFrom, Page, Patient, REGIMES, searchPatients } from "@/lib/api/patients";

const PAGE_SIZE = 20;

export function PageClient() {
  const { teamId } = useParams<{ teamId: string }>();
  const router = useRouter();
  const user = useUser({ or: "redirect" });
  // Keep the latest user in a ref so `load` doesn't re-run when useUser()
  // hands back a new object for the same session.
  const userRef = React.useRef(user);
  userRef.current = user;

  const [q, setQ] = React.useState("");
  const [query, setQuery] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [result, setResult] = React.useState<Page<Patient> | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  // Search after the user stops typing for a moment.
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(q.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [q]);

  React.useEffect(() => {
    let cancelled = false;
    setError(null);
    searchPatients(userRef.current, teamId, { q: query, page, pageSize: PAGE_SIZE })
      .then((data) => !cancelled && setResult(data))
      .catch((e) => {
        if (cancelled) return;
        setError(errorMessage(e));
        setResult({ items: [], total: 0, page: 1, pageSize: PAGE_SIZE });
      });
    return () => {
      cancelled = true;
    };
  }, [teamId, query, page]);

  const lastPage = result ? Math.max(1, Math.ceil(result.total / result.pageSize)) : 1;
  const detailUrl = (id: string) => `/dashboard/${teamId}/patients/${id}`;

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Pacientes</h2>
        <Button asChild>
          <Link href={`/dashboard/${teamId}/patients/new`}>
            <UserPlus className="mr-2 h-4 w-4" />
            Registrar paciente
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="space-y-3">
          <div className="space-y-1.5">
            <CardTitle>Buscar</CardTitle>
            <CardDescription>Por número de documento o por nombre, sin importar tildes.</CardDescription>
          </div>
          <div className="relative max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              aria-label="Buscar paciente"
              placeholder="1000123456 o José Peña"
              className="pl-8"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <p className="mb-4 rounded-md border border-destructive/50 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
          {result === null ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : result.items.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {query ? "Ningún paciente coincide con la búsqueda." : "Aún no hay pacientes registrados."}
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="py-2 pr-4 font-medium">Documento</th>
                      <th className="py-2 pr-4 font-medium">Nombre</th>
                      <th className="py-2 pr-4 text-right font-medium">Edad</th>
                      <th className="py-2 pr-4 font-medium">Teléfono</th>
                      <th className="py-2 font-medium">Afiliación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.items.map((patient) => (
                      <tr
                        key={patient.id}
                        className="cursor-pointer border-b last:border-0 hover:bg-muted/50"
                        onClick={() => router.push(detailUrl(patient.id))}
                      >
                        <td className="py-2 pr-4 font-mono text-xs">
                          {patient.document.type} {patient.document.number}
                        </td>
                        <td className="py-2 pr-4 font-medium">
                          <Link href={detailUrl(patient.id)} onClick={(e) => e.stopPropagation()}>
                            {patient.fullName}
                          </Link>
                        </td>
                        <td className="py-2 pr-4 text-right tabular-nums">{ageFrom(patient.birthDate)}</td>
                        <td className="py-2 pr-4">{patient.contact.phone ?? "—"}</td>
                        <td className="py-2">
                          {patient.affiliation.eps ?? REGIMES[patient.affiliation.regime]}
                          {patient.affiliation.eps && (
                            <span className="text-muted-foreground"> · {REGIMES[patient.affiliation.regime]}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  {result.total} paciente{result.total === 1 ? "" : "s"}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                    aria-label="Página anterior"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span>
                    Página {page} de {lastPage}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= lastPage}
                    onClick={() => setPage(page + 1)}
                    aria-label="Página siguiente"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
