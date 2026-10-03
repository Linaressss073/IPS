"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { NoPermission, useAccess } from "@/components/access/access-context";
import { ConsultationEditor } from "@/components/consultation/consultation-editor";
import { ConsultationRecord } from "@/components/consultation/consultation-record";
import { PageHeader, PageShell } from "@/components/page-header";
import { errorMessage } from "@/components/patients/error-message";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  addAddendum,
  Consultation,
  getConsultation,
  saveConsultation,
  signConsultation,
} from "@/lib/api/consultation";
import { formatDay } from "@/lib/api/scheduling";
import { useApiAuth } from "@/lib/api/use-api-auth";

/** A consultation: the draft editor for its physician, the signed record otherwise. */
export function PageClient() {
  const { teamId, consultationId } = useParams<{ teamId: string; consultationId: string }>();
  const auth = useApiAuth();
  const { access, can } = useAccess();
  const [state, setState] = React.useState<{ loading: true } | { loading: false; consultation: Consultation }>({
    loading: true,
  });
  const setConsultation = (consultation: Consultation) => setState({ loading: false, consultation });
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (!can("clinical:read")) return;
    getConsultation(auth, teamId, consultationId)
      .then(setConsultation)
      .catch((e) => setError(errorMessage(e)));
  }, [auth, teamId, consultationId, can]);

  if (access && !can("clinical:read")) return <NoPermission what="ver historias clínicas" />;

  const isMine = !state.loading && state.consultation.physician.userId === access?.userId && can("clinical:write");

  return (
    <PageShell className="max-w-5xl">
      {!state.loading && (
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/dashboard/${teamId}/patients/${state.consultation.patient.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Ficha del paciente
          </Link>
        </Button>
      )}
      {error && <p className="rounded-md border border-destructive/50 px-3 py-2 text-sm text-destructive">{error}</p>}
      {state.loading ? (
        !error && <Skeleton className="h-64 w-full" />
      ) : (
        <ConsultationBody
          consultation={state.consultation}
          isMine={isMine}
          onSave={async (draft) => setConsultation(await saveConsultation(auth, teamId, state.consultation, draft))}
          onSign={async (draft) => {
            const saved = await saveConsultation(auth, teamId, state.consultation, draft);
            setConsultation(await signConsultation(auth, teamId, saved));
          }}
          onAddendum={async (text) => setConsultation(await addAddendum(auth, teamId, state.consultation, text))}
        />
      )}
    </PageShell>
  );
}

function ConsultationBody(props: {
  consultation: Consultation;
  isMine: boolean;
  onSave: React.ComponentProps<typeof ConsultationEditor>["onSave"];
  onSign: React.ComponentProps<typeof ConsultationEditor>["onSign"];
  onAddendum: (text: string) => Promise<void>;
}) {
  const { consultation: c, isMine } = props;
  return (
    <>
      <PageHeader
        eyebrow={c.status === "firmada" ? "Consulta firmada" : "Consulta en curso"}
        title={c.patient.fullName || "Paciente"}
        description={
          <>
            {c.patient.document.type} {c.patient.document.number} · {c.service.code} {c.service.name} ·{" "}
            {c.location.label} · <span className="capitalize">{formatDay(c.appointment.date)}</span>{" "}
            {c.appointment.time} · {c.physician.displayName || c.physician.userId}
            {c.signature.signed &&
              ` · Firmada ${new Date(c.signature.at).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" })}`}
          </>
        }
      />
      {c.status === "en_curso" && isMine ? (
        <ConsultationEditor
          key={c.id}
          consultation={c}
          onSave={props.onSave}
          onSign={props.onSign}
        />
      ) : c.status === "en_curso" ? (
        <p className="rounded-md border px-4 py-3 text-sm text-muted-foreground">
          La consulta está en curso con {c.physician.displayName || "su profesional"}; podrás leerla cuando la firme.
        </p>
      ) : (
        <ConsultationRecord
          consultation={c}
          canAmend={isMine}
          onAddendum={props.onAddendum}
        />
      )}
    </>
  );
}
