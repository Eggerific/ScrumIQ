"use client";

import { useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageShell } from "@/components/app/PageShell";
import { ProjectAiFlowView } from "@/components/projects/ai-flow/ProjectAiFlowView";
import { useProjectsWorkspace } from "@/components/projects/ProjectsWorkspaceProvider";
import { readAiBriefEngagement } from "@/lib/projects/ai-brief-storage";
import { reconcileStaleCompleteEngagement } from "@/lib/projects/ai-brief-engagement-reconcile";
import { useHasBacklogDraft } from "@/hooks/use-has-backlog-draft";

export default function ProjectBriefPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = typeof params.id === "string" ? params.id : "";
  const { projects, projectsHydrated, updateProject } = useProjectsWorkspace();
  const project = projects.find((p) => p.id === projectId);
  const hasBacklogDraft = useHasBacklogDraft(projectId || null);

  const storedEngagement = useMemo(() => {
    if (typeof window === "undefined" || !projectId) return null;
    return readAiBriefEngagement(projectId);
  }, [projectId]);

  const effectiveEngagement =
    project?.aiBriefEngagement ?? storedEngagement ?? undefined;

  useEffect(() => {
    if (!projectsHydrated || !projectId || !project) return;
    const eng =
      project.aiBriefEngagement ?? readAiBriefEngagement(projectId) ?? undefined;
    const { changed, next } = reconcileStaleCompleteEngagement(projectId, eng);
    if (changed && next === "dismissed") {
      updateProject(projectId, { aiBriefEngagement: "dismissed" });
    }
  }, [projectsHydrated, projectId, project, updateProject]);

  useEffect(() => {
    if (!projectsHydrated || !projectId || !project) return;
    if (effectiveEngagement === "complete" && hasBacklogDraft) {
      router.replace(`/projects/${projectId}/backlog`);
    }
  }, [
    projectsHydrated,
    projectId,
    project,
    effectiveEngagement,
    hasBacklogDraft,
    router,
  ]);

  if (!projectsHydrated) {
    return (
      <PageShell title="AI Generation" subtitle="Loading workspace…">
        <p className="text-sm text-zinc-500">Loading…</p>
      </PageShell>
    );
  }

  if (projectId && project && effectiveEngagement === "complete" && hasBacklogDraft) {
    return (
      <PageShell
        title="AI Generation"
        subtitle="Your backlog draft is in this session. Opening the backlog…"
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
