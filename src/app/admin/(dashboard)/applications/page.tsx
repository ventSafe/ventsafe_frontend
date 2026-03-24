import type {Metadata } from "next"
import ApplicationsClient from "./ApplicationsClient";

export const metadata: Metadata = {
  title: "Applications | VentSafe Admin",
  description: "Review and manage counsellor applications",
};

export default function ApplicationsPage() {
  return <ApplicationsClient />;
}