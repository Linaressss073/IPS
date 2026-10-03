import { Metadata } from "next";
import { PageClient } from "./page-client";

export const metadata: Metadata = {
  title: "Admisión",
};

export default function Page() {
  return <PageClient />;
}
