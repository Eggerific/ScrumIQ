import type { Metadata } from "next";
import { PageShell } from "@/components/app/PageShell";
import { Dashboard } from "@/components/app/Dashboard";

export const metadata: Metadata = {
  title: "Dashboard",
};

/** Served at http://localhost:3000/dashboard (after login). */
export default function DashboardPage() {
  return (
    <PageShell
      title="Dashboard"
      subtitle="Overview of your workspace, numbers will connect to real data soon."
    >
      <Dashboard />
    </PageShell>
  );
}
