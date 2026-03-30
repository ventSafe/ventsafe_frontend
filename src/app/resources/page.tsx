import type { Metadata } from "next";
import ResourcesClient from "./ResourcesClient";
export const metadata: Metadata = { title: "Resources | VentSafe" };
export default function ResourcesPage() {
  return <ResourcesClient />;
}
