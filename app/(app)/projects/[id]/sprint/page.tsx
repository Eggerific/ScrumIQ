"use client";

import { useParams, useRouter } from "next/navigation";
import { SprintBacklogView } from "@/components/projects/SprintBacklogView";
import { PageShell } from "@/components/app/PageShell";
import { useProjectsWorkspace } from "@/components/projects/ProjectsWorkspaceProvider";

export default function ProjectSprintPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = typeof params.id === "string" ? params.id : "";
  const { projects, projectsHydrated } = useProjectsWorkspace();
  const project = projects.find((p) => p.id === projectId);

  if (!projectsHydrated) {
    return (
      <PageShell title="Sprint backlog" subtitle="Loading workspace…">
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
    <SprintBacklogView
      key={projectId}
      projectId={projectId}
      projectName={project.name}
    />
  );
}
