"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DOCUMENT_TYPES, Patient, PatientInput, REGIMES, SEXES } from "@/lib/api/patients";
import { CompanionFields, CompanionState, emptyCompanion, toCompanionInput } from "./companion-fields";
import { errorMessage } from "./error-message";
import { Field, Section, Select } from "./form-controls";
import { TeamMember } from "./use-team-members";

type FormState = {
  documentType: string;
  documentNumber: string;
  firstName: string;
  middleName: string;
  firstLastName: string;
  secondLastName: string;
  birthDate: string;
  sex: string;
  email: string;
  phone: string;
  address: string;
  eps: string;
  regime: string;
  requestedBy: string;
};

function toState(patient?: Patient): FormState {
  return {
    documentType: patient?.document.type ?? "CC",
    documentNumber: patient?.document.number ?? "",
    firstName: patient?.name.firstName ?? "",
    middleName: patient?.name.middleName ?? "",
    firstLastName: patient?.name.firstLastName ?? "",
    secondLastName: patient?.name.secondLastName ?? "",
    birthDate: patient?.birthDate ?? "",
    sex: patient?.sex ?? "",
    email: patient?.contact.email ?? "",
    phone: patient?.contact.phone ?? "",
    address: patient?.contact.address ?? "",
    eps: patient?.affiliation.eps ?? "",
    regime: patient?.affiliation.regime ?? "contributivo",
    requestedBy: "",
  };
}

function toInput(state: FormState): PatientInput {
  const orNull = (value: string) => value.trim() || null;
  return {
    document: { type: state.documentType, number: state.documentNumber },
    name: {
      firstName: state.firstName,
      middleName: orNull(state.middleName),
      firstLastName: state.firstLastName,
      secondLastName: orNull(state.secondLastName),
    },
    birthDate: state.birthDate,
    sex: state.sex,
    contact: { email: state.email, phone: orNull(state.phone), address: orNull(state.address) },
    affiliation: {
      eps: state.regime === "particular" ? null : orNull(state.eps),
      regime: state.regime,
    },
    requestedBy: state.requestedBy || undefined,
  };
}

/**
 * Register or edit a patient. Business rules are validated by the API.
 * `withCompanion` offers recording the first companion (#1) on registration.
 */
export function PatientForm(props: {
  patient?: Patient;
  withCompanion?: boolean;
  members: TeamMember[];
  submitLabel: string;
  onSubmit: (input: PatientInput) => Promise<void>;
  onCancel?: () => void;
}) {
  const [state, setState] = React.useState(() => toState(props.patient));
  const [hasCompanion, setHasCompanion] = React.useState(false);
  const [companion, setCompanion] = React.useState<CompanionState>(emptyCompanion);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const set = (field: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => setState((current) => ({ ...current, [field]: e.target.value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const input = toInput(state);
      if (props.withCompanion && hasCompanion) input.companion = toCompanionInput(companion);
      await props.onSubmit(input);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const particular = state.regime === "particular";

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Section title="Identificación">
        <Field label="Tipo de documento" id="documentType">
          <Select id="documentType" value={state.documentType} onChange={set("documentType")} required>
            {Object.entries(DOCUMENT_TYPES).map(([code, label]) => (
              <option key={code} value={code}>
                {code} · {label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Número de documento" id="documentNumber">
          <Input
            id="documentNumber"
            placeholder="1000123456"
            value={state.documentNumber}
            onChange={set("documentNumber")}
            required
          />
        </Field>
      </Section>

      <Section title="Nombre">
        <Field label="Primer nombre" id="firstName">
          <Input id="firstName" value={state.firstName} onChange={set("firstName")} required />
        </Field>
        <Field label="Segundo nombre (opcional)" id="middleName">
          <Input id="middleName" value={state.middleName} onChange={set("middleName")} />
        </Field>
        <Field label="Primer apellido" id="firstLastName">
          <Input id="firstLastName" value={state.firstLastName} onChange={set("firstLastName")} required />
        </Field>
        <Field label="Segundo apellido (opcional)" id="secondLastName">
          <Input id="secondLastName" value={state.secondLastName} onChange={set("secondLastName")} />
        </Field>
        <Field label="Fecha de nacimiento" id="birthDate">
          <Input id="birthDate" type="date" value={state.birthDate} onChange={set("birthDate")} required />
        </Field>
        <Field label="Sexo biológico" id="sex">
          <Select id="sex" value={state.sex} onChange={set("sex")} required>
            <option value="" disabled>
              Seleccionar…
            </option>
            {Object.entries(SEXES).map(([code, label]) => (
              <option key={code} value={code}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
      </Section>

      <Section title="Contacto">
        <Field label="Correo electrónico" id="email">
          <Input id="email" type="email" value={state.email} onChange={set("email")} required />
        </Field>
        <Field label="Teléfono (opcional)" id="phone">
          <Input id="phone" type="tel" value={state.phone} onChange={set("phone")} />
        </Field>
        <Field label="Dirección (opcional)" id="address" wide>
          <Input id="address" value={state.address} onChange={set("address")} />
        </Field>
      </Section>

      <Section title="Afiliación">
        <Field label="Régimen" id="regime">
          <Select id="regime" value={state.regime} onChange={set("regime")} required>
            {Object.entries(REGIMES).map(([code, label]) => (
              <option key={code} value={code}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={particular ? "EPS (no aplica)" : "EPS"} id="eps">
          <Input
            id="eps"
            placeholder={particular ? "" : "Sanitas"}
            value={particular ? "" : state.eps}
            onChange={set("eps")}
            disabled={particular}
            required={!particular}
          />
        </Field>
      </Section>

      {props.withCompanion && (
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={hasCompanion}
              onChange={(e) => setHasCompanion(e.target.checked)}
            />
            Llega con acompañante
          </label>
          {hasCompanion && (
            <CompanionFields state={companion} onChange={setCompanion} idPrefix="companion" />
          )}
        </div>
      )}

      <Section title="Trazabilidad">
        <Field label="Solicitado por" id="requestedBy">
          <Select id="requestedBy" value={state.requestedBy} onChange={set("requestedBy")}>
            <option value="">Yo mismo</option>
            {props.members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </Select>
        </Field>
      </Section>

      {error && (
        <p className="rounded-md border border-destructive/50 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Guardando…" : props.submitLabel}
        </Button>
        {props.onCancel && (
          <Button type="button" variant="ghost" onClick={props.onCancel} disabled={submitting}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
}
