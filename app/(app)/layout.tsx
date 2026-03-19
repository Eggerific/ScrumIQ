import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/nav/Sidebar";
import { AppMain } from "@/components/app/AppMain";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const fullName =
    (session.user.user_metadata?.full_name as string | undefined)?.trim() ||
    session.user.email?.split("@")[0] ||
    "User";
  const email = session.user.email ?? "";

  return (
    <div
      className="flex h-screen w-full"
      style={{ background: "var(--background)" }}
    >
      <Sidebar fullName={fullName} email={email} />
      <AppMain>{children}</AppMain>
    </div>
  );
}
