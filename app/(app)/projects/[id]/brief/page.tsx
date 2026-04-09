"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageShell } from "@/components/app/PageShell";
import { ProjectAiFlowView } from "@/components/projects/ai-flow/ProjectAiFlowView";
import { useProjectsWorkspace } from "@/components/projects/ProjectsWorkspaceProvider";
import {
  readAiBriefEngagement,
  writeAiBriefEngagement,
} from "@/lib/projects/ai-brief-storage";
import { createClient } from "@/lib/supabase/client";
import { healStalePendingAiBriefEngagement } from "@/lib/projects/heal-stale-ai-brief-engagement";
import { mapAiBriefEngagement } from "@/lib/projects/supabase-projects";

export default function ProjectBriefPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = typeof params.id === "string" ? params.id : "";
  const { projects, projectsHydrated, updateProject } = useProjectsWorkspace();
  const project = projects.find((p) => p.id === projectId);

  const storedEngagement = useMemo(() => {
    if (typeof window === "undefined" || !projectId) return null;
    return readAiBriefEngagement(projectId);
  }, [projectId]);

  /**
   * Fetch `ai_brief_engagement` when workspace shows unknown or stale `pending`.
   * If the DB still says `pending` but stories exist (saved backlog), heal to `complete`.
   */
  const [engagementFromDbResolved, setEngagementFromDbResolved] = useState(false);

  useEffect(() => {
    if (!projectsHydrated || !projectId || !project) {
      setEngagementFromDbResolved(false);
      return;
    }
    if (
      project.aiBriefEngagement !== undefined &&
      project.aiBriefEngagement !== "pending"
    ) {
      setEngagementFromDbResolved(true);
      return;
    }
    let cancelled = false;
    setEngagementFromDbResolved(false);
    const supabase = createClient();
    void (async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("ai_brief_engagement")
        .eq("id", projectId)
        .maybeSingle();
      if (cancelled) return;
      if (error || !data) {
        setEngagementFromDbResolved(true);
        return;
      }
      const raw = data.ai_brief_engagement as string | null | undefined;
      let mapped = mapAiBriefEngagement(raw);

      if (mapped === "pending") {
        const healed = await healStalePendingAiBriefEngagement(
          supabase,
          projectId,
          raw
        );
        mapped = healed.engagement;
        if (healed.healed && mapped === "complete") {
          updateProject(projectId, { aiBriefEngagement: "complete" });
          writeAiBriefEngagement(projectId, "complete");
          setEngagementFromDbResolved(true);
          return;
        }
      }

      if (mapped !== undefined) {
        updateProject(projectId, { aiBriefEngagement: mapped });
        writeAiBriefEngagement(projectId, mapped);
      }
      setEngagementFromDbResolved(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [projectsHydrated, projectId, project?.id, project?.aiBriefEngagement, updateProject]);

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
    project &&
    (project.aiBriefEngagement === undefined ||
      project.aiBriefEngagement === "pending") &&
    !engagementFromDbResolved
  ) {
    return (
      <PageShell
        title="AI Generation"
        subtitle="Loading project state…"
      >
        <p className="text-sm text-zinc-500">Checking AI Generation status…</p>
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
