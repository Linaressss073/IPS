"use client";

import * as React from "react";
import { errorMessage } from "@/components/patients/error-message";
import { Input } from "@/components/ui/input";
import { TokenSource } from "@/lib/api/client";
import { Patient, searchPatients } from "@/lib/api/patients";

const SEARCH_DELAY_MS = 300;

/** Finds a registered patient by document or name. */
export function PatientPicker(props: {
  auth: TokenSource;
  teamId: string;
  onPick: (patient: Patient) => void;
}) {
  const { auth, teamId } = props;
  const [q, setQ] = React.useState("");
  const [results, setResults] = React.useState<Patient[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (q.trim().length < 2) {
      setResults(null);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      searchPatients(auth, teamId, { q, pageSize: 8 })
        .then((page) => !cancelled && setResults(page.items))
        .catch((e) => !cancelled && setError(errorMessage(e)));
    }, SEARCH_DELAY_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [auth, teamId, q]);

  return (
    <div className="space-y-2">
      <Input
        autoFocus
        placeholder="Documento o nombre del paciente"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      {results && results.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No hay pacientes con ese dato. Regístralo primero en Pacientes.
        </p>
      )}
      {results && results.length > 0 && (
        <ul className="divide-y rounded-md border">
          {results.map((patient) => (
            <li key={patient.id}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                onClick={() => props.onPick(patient)}
              >
                <span className="font-medium">{patient.fullName}</span>
                <span className="text-muted-foreground">
                  {" "}
                  · {patient.document.type} {patient.document.number}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
