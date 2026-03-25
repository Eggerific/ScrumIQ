"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText } from "lucide-react";
import { PageShell } from "@/components/app/PageShell";
import {
  readAiBriefEngagement,
  writeAiBriefEngagement,
} from "@/lib/projects/ai-brief-storage";
import { ProjectAiBriefModal } from "./ProjectAiBriefModal";
import { useProjectsWorkspace } from "./ProjectsWorkspaceProvider";
import type { AiBriefEngagement } from "./project-types";

function blocksAutoOpen(e: AiBriefEngagement | undefined | null): boolean {
  return e === "complete" || e === "skipped" || e === "dismissed";
}

export function ProjectWorkspaceView({ projectId }: { projectId: string }) {
  const router = useRouter();
  const { projects, updateProject, projectsHydrated } = useProjectsWorkspace();
  const project = projects.find((p) => p.id === projectId);
  const [briefOpen, setBriefOpen] = useState(false);

  const storedEngagement =
    typeof window !== "undefined" && project
      ? readAiBriefEngagement(project.id)
      : null;

  const engagement: AiBriefEngagement | undefined =
    project?.aiBriefEngagement ?? storedEngagement ?? undefined;

  // Sync localStorage → workspace list when Supabase omits engagement (e.g. after refresh).
  useEffect(() => {
    if (!projectsHydrated || !project) return;
    if (project.aiBriefEngagement !== undefined) return;
    const stored = readAiBriefEngagement(project.id);
    if (stored) {
      updateProject(project.id, { aiBriefEngagement: stored });
    }
  }, [projectsHydrated, project, updateProject]);

  // First visit (or no saved dismiss/complete): open AI brief automatically.
  useEffect(() => {
    if (!projectsHydrated || !project) return;
    const stored = readAiBriefEngagement(project.id);
    if (blocksAutoOpen(stored) || blocksAutoOpen(project.aiBriefEngagement)) {
      return;
    }
    const id = requestAnimationFrame(() => setBriefOpen(true));
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- project object identity churns on list refetch; id + engagement suffice
  }, [projectsHydrated, project?.id, project?.aiBriefEngagement]);

  const handleDismissTemporary = useCallback(() => {
    if (!project) return;
    const stored = readAiBriefEngagement(project.id);
    if (
      project.aiBriefEngagement === "complete" ||
      project.aiBriefEngagement === "skipped" ||
      stored === "complete" ||
      stored === "skipped"
    ) {
      return;
    }
    writeAiBriefEngagement(project.id, "dismissed");
    updateProject(project.id, { aiBriefEngagement: "dismissed" });
  }, [project, updateProject]);

  const handleContinue = useCallback(() => {
    if (!project) return;
    writeAiBriefEngagement(project.id, "complete");
    updateProject(project.id, { aiBriefEngagement: "complete" });
  }, [project, updateProject]);

  if (!projectsHydrated) {
    return (
      <PageShell title="Project" subtitle="Loading workspace…">
        <p className="text-sm text-zinc-500">Loading project…</p>
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

  const showBriefReopen =
    engagement === "dismissed" ||
    engagement === "complete" ||
    engagement === "skipped";

  let subtitle =
    "Use the sidebar for Backlog, Sprint, Kanban, and Team when those routes exist.";
  if (engagement === "pending") {
    subtitle =
      "A one-time dialog explains the planned AI brief fields (generation not wired yet).";
  } else if (engagement === "dismissed") {
    subtitle =
      "The AI brief intro is available below whenever you want it — you’re not stuck in a modal.";
  } else if (engagement === "skipped") {
    subtitle =
      "Open the preview anytime to see which fields the future AI brief will populate.";
  } else if (engagement === "complete") {
    subtitle =
      "Use the sidebar to open Backlog, Sprint, Kanban, or Team when available.";
  }

  return (
    <>
      <PageShell title={project.name} subtitle={subtitle}>
        {showBriefReopen ? (
          <button
            type="button"
            onClick={() => setBriefOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--app-sidebar-border)] bg-[var(--background)]/40 px-4 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:border-[var(--app-accent)]/40 hover:bg-[var(--app-nav-hover-bg)]"
          >
            <FileText className="h-4 w-4 text-[var(--app-accent)]" aria-hidden />
            AI project brief
          </button>
        ) : null}
      </PageShell>

      <ProjectAiBriefModal
        open={briefOpen}
        onOpenChange={setBriefOpen}
        projectName={project.name}
        onDismissTemporary={handleDismissTemporary}
        onContinue={handleContinue}
      />
    </>
  );
}
