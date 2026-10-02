import { Metadata } from "next";
import { PageClient } from "./page-client";

export const metadata: Metadata = {
  title: "Datos de la IPS",
};

export default function SettingsPage() {
  return <PageClient />;
}
