import { Metadata } from "next";
import { PageClient } from "./page-client";

export const metadata: Metadata = {
  title: "Pantalla de turnos",
};

export default function Page() {
  return <PageClient />;
}
