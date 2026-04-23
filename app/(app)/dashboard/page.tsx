import type { Metadata } from "next";
import { PageShell } from "@/components/app/PageShell";
import { Dashboard } from "@/components/app/Dashboard";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Dashboard",
};

function dashboardGreetingName(
  fullName: string | undefined,
  email: string | undefined
): string {
  const trimmed = fullName?.trim();
  if (trimmed) {
    const first = trimmed.split(/\s+/)[0];
    return (first && first.length > 0 ? first : trimmed) ?? "there";
  }
  const local = email?.split("@")[0]?.trim();
  if (local) return local;
  return "there";
}

/** Served at http://localhost:3000/dashboard (after login). */
export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const fullName = (user?.user_metadata?.full_name as string | undefined)?.trim();
  const userName = dashboardGreetingName(fullName, user?.email ?? undefined);

  return (
    <PageShell
      title="Dashboard"
      subtitle="Live workspace stats from your project list; charts preview motion until analytics APIs land."
    >
      <Dashboard userName={userName} />
    </PageShell>
  );
}