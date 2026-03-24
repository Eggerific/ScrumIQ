"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText } from "lucide-react";
import { PageShell } from "@/components/app/PageShell";
import { ProjectAiBriefModal } from "./ProjectAiBriefModal";
import { useProjectsWorkspace } from "./ProjectsWorkspaceProvider";

export function ProjectWorkspaceView({ projectId }: { projectId: string }) {
  const router = useRouter();
  const { projects, updateProject } = useProjectsWorkspace();
  const project = projects.find((p) => p.id === projectId);
  const [briefOpen, setBriefOpen] = useState(false);

  useEffect(() => {
    if (project?.aiBriefEngagement === "pending") {
      setBriefOpen(true);
    }
  }, [project?.aiBriefEngagement, project?.id]);

  const finishBriefIntro = useCallback(() => {
    if (!project || project.aiBriefEngagement !== "pending") return;
    updateProject(project.id, { aiBriefEngagement: "complete" });
  }, [project, updateProject]);

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

  const engagement = project.aiBriefEngagement;
  const needsBriefIntro = engagement === "pending";
  const skippedBrief = engagement === "skipped";
  const briefDone =
    engagement === "complete" || engagement === undefined;

  let subtitle =
    "Use the sidebar for Backlog, Sprint, Kanban, and Team when those routes exist.";
  if (needsBriefIntro) {
    subtitle =
      "A one-time dialog explains the planned AI brief fields (generation not wired yet).";
  } else if (skippedBrief) {
    subtitle =
      "Open the preview anytime to see which fields the future AI brief will populate.";
  } else if (briefDone) {
    subtitle =
      "Use the sidebar to open Backlog, Sprint, Kanban, or Team when available.";
  }

  return (
    <>
      <PageShell title={project.name} subtitle={subtitle}>
        {skippedBrief ? (
          <button
            type="button"
            onClick={() => setBriefOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--app-sidebar-border)] bg-[var(--background)]/40 px-4 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:border-[var(--app-accent)]/40 hover:bg-[var(--app-nav-hover-bg)]"
          >
            <FileText className="h-4 w-4 text-[var(--app-accent)]" aria-hidden />
            Planned brief fields
          </button>
        ) : null}
      </PageShell>

      <ProjectAiBriefModal
        open={briefOpen}
        onOpenChange={setBriefOpen}
        projectName={project.name}
        finishEngagementOnDismiss={needsBriefIntro}
        onFinishEngagement={finishBriefIntro}
      />
    </>
  );
}
