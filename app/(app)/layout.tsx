import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/nav/Sidebar";
import { AppMain } from "@/components/app/AppMain";
import { ProjectsWorkspaceProvider } from "@/components/projects/ProjectsWorkspaceProvider";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const fullName =
    (user.user_metadata?.full_name as string | undefined)?.trim() ||
    user.email?.split("@")[0] ||
    "User";
  const email = user.email ?? "";

  return (
    <ProjectsWorkspaceProvider>
      {/* h-screen + overflow-hidden: sidebar stays full viewport height; only AppMain scrolls */}
      <div className="flex h-screen min-h-0 w-full overflow-hidden bg-[var(--background)]">
        <Sidebar fullName={fullName} email={email} />
        <AppMain>{children}</AppMain>
      </div>
    </ProjectsWorkspaceProvider>
  );
}
