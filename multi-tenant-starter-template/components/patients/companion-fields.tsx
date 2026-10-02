"use client";

import { Input } from "@/components/ui/input";
import { CompanionInput, DOCUMENT_TYPES, RELATIONSHIPS } from "@/lib/api/patients";
import { Field, Section, Select } from "./form-controls";

export type CompanionState = {
  relationship: string;
  firstName: string;
  middleName: string;
  firstLastName: string;
  secondLastName: string;
  documentType: string;
  documentNumber: string;
  phone: string;
  email: string;
};

export const emptyCompanion: CompanionState = {
  relationship: "",
  firstName: "",
  middleName: "",
  firstLastName: "",
  secondLastName: "",
  documentType: "CC",
  documentNumber: "",
  phone: "",
  email: "",
};

/** Empty groups are sent as null; the API checks there is a name or a phone. */
export function toCompanionInput(state: CompanionState): CompanionInput {
  const orNull = (value: string) => value.trim() || null;
  const hasName = [state.firstName, state.middleName, state.firstLastName, state.secondLastName].some(
    (part) => part.trim(),
  );
  return {
    relationship: orNull(state.relationship),
    name: hasName
      ? {
          firstName: state.firstName,
          middleName: orNull(state.middleName),
          firstLastName: state.firstLastName,
          secondLastName: orNull(state.secondLastName),
        }
      : null,
    document: state.documentNumber.trim()
      ? { type: state.documentType, number: state.documentNumber }
      : null,
    phone: orNull(state.phone),
    email: orNull(state.email),
  };
}

/** All optional, but fill in at least a name or a phone. */
export function CompanionFields(props: {
  state: CompanionState;
  onChange: (state: CompanionState) => void;
  idPrefix: string;
}) {
  const { state } = props;
  const id = (field: string) => `${props.idPrefix}-${field}`;
  const set = (field: keyof CompanionState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => props.onChange({ ...state, [field]: e.target.value });

  return (
    <Section title="Acompañante">
      <Field label="Parentesco" id={id("relationship")}>
        <Select id={id("relationship")} value={state.relationship} onChange={set("relationship")}>
          <option value="">Sin especificar</option>
          {Object.entries(RELATIONSHIPS).map(([code, label]) => (
            <option key={code} value={code}>
              {label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Teléfono" id={id("phone")}>
        <Input id={id("phone")} type="tel" value={state.phone} onChange={set("phone")} />
      </Field>
      <Field label="Primer nombre" id={id("firstName")}>
        <Input id={id("firstName")} value={state.firstName} onChange={set("firstName")} />
      </Field>
      <Field label="Segundo nombre" id={id("middleName")}>
        <Input id={id("middleName")} value={state.middleName} onChange={set("middleName")} />
      </Field>
      <Field label="Primer apellido" id={id("firstLastName")}>
        <Input id={id("firstLastName")} value={state.firstLastName} onChange={set("firstLastName")} />
      </Field>
      <Field label="Segundo apellido" id={id("secondLastName")}>
        <Input id={id("secondLastName")} value={state.secondLastName} onChange={set("secondLastName")} />
      </Field>
      <Field label="Tipo de documento" id={id("documentType")}>
        <Select id={id("documentType")} value={state.documentType} onChange={set("documentType")}>
          {Object.entries(DOCUMENT_TYPES).map(([code, label]) => (
            <option key={code} value={code}>
              {code} · {label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Número de documento" id={id("documentNumber")}>
        <Input id={id("documentNumber")} value={state.documentNumber} onChange={set("documentNumber")} />
      </Field>
      <Field label="Correo electrónico" id={id("email")} wide>
        <Input id={id("email")} type="email" value={state.email} onChange={set("email")} />
      </Field>
      <p className="text-xs text-muted-foreground md:col-span-2">
        Todo es opcional, pero indica al menos el nombre o el teléfono.
      </p>
    </Section>
  );
}
