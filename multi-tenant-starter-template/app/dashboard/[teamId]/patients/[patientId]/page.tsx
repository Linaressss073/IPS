import { Metadata } from "next";
import { PageClient } from "./page-client";

export const metadata: Metadata = {
  title: "Paciente",
};

export default function PatientPage() {
  return <PageClient />;
}
