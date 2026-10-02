import { Metadata } from "next";
import { PageClient } from "./page-client";

export const metadata: Metadata = {
  title: "Registrar paciente",
};

export default function NewPatientPage() {
  return <PageClient />;
}
