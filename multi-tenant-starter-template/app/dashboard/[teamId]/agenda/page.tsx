import { Metadata } from "next";
import { Suspense } from "react";
import { PageClient } from "./page-client";

export const metadata: Metadata = {
  title: "Agenda",
};

export default function AgendaPage() {
  // useSearchParams (?patientId=…) needs a Suspense boundary.
  return (
    <Suspense>
      <PageClient />
    </Suspense>
  );
}
