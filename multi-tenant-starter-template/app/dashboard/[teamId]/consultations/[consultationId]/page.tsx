import { Metadata } from "next";
import { PageClient } from "./page-client";

export const metadata: Metadata = {
  title: "Consulta",
};

export default function ConsultationPage() {
  return <PageClient />;
}
