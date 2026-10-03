import { Metadata } from "next";
import { PageClient } from "./page-client";

export const metadata: Metadata = {
  title: "Farmacia",
};

export default function PharmacyPage() {
  return <PageClient />;
}
