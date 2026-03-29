"use client";

import { useParams, useRouter } from "next/navigation";
import { PageShell } from "@/components/app/PageShell";
import { ProjectAiFlowView } from "@/components/projects/ai-flow/ProjectAiFlowView";
import { useProjectsWorkspace } from "@/components/projects/ProjectsWorkspaceProvider";

export default function ProjectBriefPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = typeof params.id === "string" ? params.id : "";
  const { projects, projectsHydrated } = useProjectsWorkspace();
  const project = projects.find((p) => p.id === projectId);

  if (!projectsHydrated) {
    return (
      <PageShell title="AI Generation" subtitle="Loading workspace…">
        <p className="text-sm text-zinc-500">Loading…</p>
      </PageShell>
    );
  }

  if (!projectId || !project) {
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
    <ProjectAiFlowView projectId={project.id} projectName={project.name} />
  );
}
