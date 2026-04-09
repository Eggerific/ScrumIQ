"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageShell } from "@/components/app/PageShell";
import type { AiBacklogDraftPayload } from "@/lib/projects/ai-backlog-draft-types";
import { readBacklogDraft } from "@/lib/projects/backlog-draft-storage";
import { readAiBriefEngagement } from "@/lib/projects/ai-brief-storage";
import { reconcileStaleCompleteEngagement } from "@/lib/projects/ai-brief-engagement-reconcile";
import { fetchProjectBacklogDraftFromDb } from "@/lib/projects/fetch-project-backlog-draft";
import { createClient } from "@/lib/supabase/client";
import { useProjectsWorkspace } from "@/components/projects/ProjectsWorkspaceProvider";
import { useEffect, useMemo, useState } from "react";
import { BacklogArtifactsPanel } from "@/components/projects/BacklogArtifactsPanel";
import { BacklogEmptyState } from "@/components/projects/BacklogEmptyState";

export function ProjectBacklogView({ projectId }: { projectId: string }) {
  const router = useRouter();
  const { projects, projectsHydrated, updateProject } = useProjectsWorkspace();
  const project = projects.find((p) => p.id === projectId);

  const sessionDraft = useMemo(
    () => (projectId ? readBacklogDraft(projectId) : null),
    [projectId]
  );

  /** Populated async when there is no session draft; `undefined` = fetch in flight. */
  const [dbDraft, setDbDraft] = useState<
    AiBacklogDraftPayload | null | undefined
  >(undefined);

  useEffect(() => {
    if (sessionDraft !== null) return;
    let cancelled = false;
    const supabase = createClient();
    void (async () => {
      const fromDb = await fetchProjectBacklogDraftFromDb(supabase, projectId);
      if (cancelled) return;
      setDbDraft(fromDb ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId, sessionDraft]);

  const draft =
    sessionDraft !== null ? sessionDraft : dbDraft;

  useEffect(() => {
    if (!projectsHydrated || !project) return;
    const eng =
      project.aiBriefEngagement ?? readAiBriefEngagement(projectId) ?? undefined;
    const { changed, next } = reconcileStaleCompleteEngagement(projectId, eng);
    if (changed && next === "dismissed") {
      updateProject(projectId, { aiBriefEngagement: "dismissed" });
    }
  }, [projectsHydrated, projectId, project, updateProject]);

  if (!projectsHydrated) {
    return (
      <PageShell title="Backlog" subtitle="Loading workspace…">
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

  if (draft === undefined) {
    return (
      <PageShell title={`Backlog — ${project.name}`} subtitle="Loading…">
        <p className="text-sm text-zinc-500">Loading backlog…</p>
      </PageShell>
    );
  }

  if (!draft) {
    return (
      <PageShell
        title={`Backlog — ${project.name}`}
        subtitle={
          project.isCurrentUserOwner
            ? "No session draft on this page yet — generate from AI, confirm, then refine here."
            : "No backlog items in your session yet. If the PM has already added work, it will load from the project."
        }
      >
        <BacklogEmptyState
          projectId={projectId}
          projectName={project.name}
          isProjectOwner={project.isCurrentUserOwner}
        />
      </PageShell>
    );
  }

  return (
    <PageShell
      title={`Backlog — ${project.name}`}
      subtitle="Confirmed work from AI Generation. Use + to edit fields; “Add to sprint” on each story is a preview only. Changes save to this session."
    >
      <div className="mx-auto max-w-[1500px] space-y-8 pb-8">
        <div className="flex flex-wrap items-center gap-4">
          <Link
            href={`/projects/${projectId}`}
            className="inline-flex items-center gap-2 text-base text-zinc-300 transition-colors hover:text-[var(--foreground)]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Project home
          </Link>
        </div>
        <BacklogArtifactsPanel
          key={projectId}
          projectId={projectId}
          initialDraft={draft}
        />
      </div>
    </PageShell>
  );
}
