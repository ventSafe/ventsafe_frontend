import type { Metadata } from "next";
import DashboardClient from "./DashboardClient";

export const metadata: Metadata = {
  title: "Admin Dashboard | VentSafe Admin",
  description: "Overview of platform stats and pending actions",
};

export default function AdminDashboardPage() {
  return <DashboardClient />;
}
