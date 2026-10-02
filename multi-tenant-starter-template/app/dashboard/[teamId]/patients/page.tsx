import { Metadata } from "next";
import { PageClient } from "./page-client";

export const metadata: Metadata = {
  title: "Pacientes",
};

export default function PatientsPage() {
  return <PageClient />;
}
