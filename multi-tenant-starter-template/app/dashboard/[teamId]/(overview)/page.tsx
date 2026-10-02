import { Metadata } from "next";
import { PageClient } from "./page-client";

export const metadata: Metadata = {
  title: "Inicio",
};

export default function OverviewPage() {
  return <PageClient />;
}
