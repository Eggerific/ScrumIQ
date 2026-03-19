import type { Metadata } from "next";
import { PageShell } from "@/components/app/PageShell";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <PageShell
      title="Dashboard"
      subtitle="Analytics coming soon"
    />
  );
}
