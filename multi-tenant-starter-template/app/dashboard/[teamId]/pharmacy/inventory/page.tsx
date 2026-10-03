import { Metadata } from "next";
import { PageClient } from "./page-client";

export const metadata: Metadata = {
  title: "Inventario de farmacia",
};

export default function InventoryPage() {
  return <PageClient />;
}
