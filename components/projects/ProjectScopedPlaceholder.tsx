"use client";

import { useRouter } from "next/navigation";
import { PageShell } from "@/components/app/PageShell";
import { useProjectsWorkspace } from "@/components/projects/ProjectsWorkspaceProvider";

export function ProjectScopedPlaceholder({
  projectId,
  areaLabel,
}: {
  projectId: string;
  areaLabel: string;
}) {
  const router = useRouter();
  const { projects, projectsHydrated } = useProjectsWorkspace();
  const project = projects.find((p) => p.id === projectId);

  if (!projectsHydrated) {
    return (
      <PageShell title={areaLabel} subtitle="Loading workspace…">
        <p className="text-sm text-zinc-500">Loading…</p>
      </PageShell>
    );
  }

  if (!project) {
    return (
      <PageShell
        title="Project not found"
        subtitle="It may have been removed or this link is outdated."
      >
        <button
          type="button"
          onClick={() => router.push("/projects")}
          className="rounded-lg border border-[var(--app-sidebar-border)] px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-[var(--app-nav-hover-bg)]"
        >
          Back to projects
        </button>
      </PageShell>
    );
  }

  return (
    <PageShell
      title={`${areaLabel} — ${project.name}`}
      subtitle="This area is not built yet. Use Backlog or the AI brief flow in the meantime."
    >
      <p className="text-sm text-zinc-500">
        Placeholder route so sidebar navigation does not 404.
      </p>
    </PageShell>
  );
}
