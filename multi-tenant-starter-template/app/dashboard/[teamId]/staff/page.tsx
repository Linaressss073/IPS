import { Metadata } from "next";
import { PageClient } from "./page-client";

export const metadata: Metadata = {
  title: "Personal",
};

export default function StaffPage() {
  return <PageClient />;
}
