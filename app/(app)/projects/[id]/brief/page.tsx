"use client";

import { useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageShell } from "@/components/app/PageShell";
import { ProjectAiFlowView } from "@/components/projects/ai-flow/ProjectAiFlowView";
import { useProjectsWorkspace } from "@/components/projects/ProjectsWorkspaceProvider";
import {
  readAiBriefEngagement,
  writeAiBriefEngagement,
} from "@/lib/projects/ai-brief-storage";

export default function ProjectBriefPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = typeof params.id === "string" ? params.id : "";
  const { projects, projectsHydrated } = useProjectsWorkspace();
  const project = projects.find((p) => p.id === projectId);

  const storedEngagement = useMemo(() => {
    if (typeof window === "undefined" || !projectId) return null;
    return readAiBriefEngagement(projectId);
  }, [projectId]);

  const effectiveEngagement =
    project?.aiBriefEngagement ?? storedEngagement ?? undefined;

  /** Keep localStorage aligned with DB after refresh (single source of truth: Supabase). */
  useEffect(() => {
    if (!projectId || !project?.aiBriefEngagement) return;
    const stored = readAiBriefEngagement(projectId);
    if (stored !== project.aiBriefEngagement) {
      writeAiBriefEngagement(projectId, project.aiBriefEngagement);
    }
  }, [projectId, project?.aiBriefEngagement]);

  /** Completed AI flow + backlog saved → always open Backlog, not a new generation session. */
  useEffect(() => {
    if (!projectsHydrated || !projectId || !project?.isCurrentUserOwner) return;
    if (effectiveEngagement !== "complete") return;
    router.replace(`/projects/${projectId}/backlog`);
  }, [
    projectsHydrated,
    projectId,
    project?.isCurrentUserOwner,
    effectiveEngagement,
    router,
  ]);

  if (!projectsHydrated) {
    return (
      <PageShell title="AI Generation" subtitle="Loading workspace…">
        <p className="text-sm text-zinc-500">Loading…</p>
      </PageShell>
    );
  }

  if (
    projectId &&
    project &&
    project.isCurrentUserOwner &&
    effectiveEngagement === "complete"
  ) {
    return (
      <PageShell
        title="AI Generation"
        subtitle="You already added this project’s AI backlog. Opening Backlog…"
      >
        <p className="text-sm text-zinc-500">Redirecting…</p>
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

  if (!project.isCurrentUserOwner) {
    return (
      <PageShell
        title="AI Generation"
        subtitle="Only the project creator can run AI Generation and add items to the backlog."
      >
        <p className="max-w-md text-sm text-zinc-500">
          Ask the project manager to generate the backlog. You can use Backlog,
          Sprint, and Kanban in the sidebar once work items exist.
        </p>
        <button
          type="button"
          onClick={() => router.push(`/projects/${projectId}`)}
          className="mt-6 rounded-lg border border-[var(--app-sidebar-border)] px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-[var(--app-nav-hover-bg)]"
        >
          Back to project
        </button>
      </PageShell>
    );
  }

  return (
    <ProjectAiFlowView projectId={project.id} projectName={project.name} />
  );
}
