import { Metadata } from "next";
import { PageClient } from "./page-client";

export const metadata: Metadata = {
  title: "Servicios y consultorios",
};

export default function SchedulingSettingsPage() {
  return <PageClient />;
}
