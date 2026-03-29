"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, ListTodo } from "lucide-react";
import { PageShell } from "@/components/app/PageShell";
import { readAiBriefEngagement } from "@/lib/projects/ai-brief-storage";
import { reconcileStaleCompleteEngagement } from "@/lib/projects/ai-brief-engagement-reconcile";
import { useHasBacklogDraft } from "@/hooks/use-has-backlog-draft";
import { useProjectsWorkspace } from "./ProjectsWorkspaceProvider";
import type { AiBriefEngagement } from "./project-types";

export function ProjectWorkspaceView({ projectId }: { projectId: string }) {
  const router = useRouter();
  const { projects, updateProject, projectsHydrated } = useProjectsWorkspace();
  const project = projects.find((p) => p.id === projectId);
  const hasDraft = useHasBacklogDraft(projectId);

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

  // `complete` in localStorage but session backlog draft missing (new session) → allow AI again.
  useEffect(() => {
    if (!projectsHydrated || !project) return;
    const eng =
      project.aiBriefEngagement ?? readAiBriefEngagement(project.id) ?? undefined;
    const { changed, next } = reconcileStaleCompleteEngagement(project.id, eng);
    if (changed && next === "dismissed") {
      updateProject(project.id, { aiBriefEngagement: "dismissed" });
    }
  }, [projectsHydrated, project, updateProject]);

  // New projects (`pending`): send straight into the AI brief flow once.
  useEffect(() => {
    if (!projectsHydrated || !project) return;
    if (project.aiBriefEngagement !== "pending") return;
    router.replace(`/projects/${project.id}/brief`);
  }, [projectsHydrated, project, router]);

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

  const showBacklogLink =
    hasDraft || engagement === "complete";
  const showResumeAiLink =
    (engagement === "dismissed" || engagement === "skipped") && !hasDraft;

  let subtitle =
    "Use the sidebar for AI Generation, Backlog, Sprint, Kanban, and Team.";
  if (hasDraft && engagement !== "complete") {
    subtitle =
      "You have a generated draft in this session — open Backlog to review and edit. AI Generation is closed until that draft is cleared.";
  } else if (engagement === "pending") {
    subtitle = "Opening AI Generation…";
  } else if (engagement === "dismissed") {
    subtitle =
      "Continue whenever you’re ready — use the sidebar or the button below.";
  } else if (engagement === "skipped") {
    subtitle =
      "Generate epics and stories from the sidebar or below (session draft until DB exists).";
  } else if (engagement === "complete") {
    subtitle =
      "Your backlog is on the Backlog tab — expand fields with + to edit. AI Generation stays closed while this session still has your draft.";
  }

  return (
    <PageShell title={project.name} subtitle={subtitle}>
      {project.aiBriefEngagement === "pending" ? (
        <p className="text-sm text-[var(--app-text-muted)]">
          Redirecting to AI Generation…
        </p>
      ) : showBacklogLink ? (
        <Link
          href={`/projects/${project.id}/backlog`}
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--app-sidebar-border)] bg-[var(--background)]/40 px-4 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:border-[var(--app-accent)]/40 hover:bg-[var(--app-nav-hover-bg)]"
        >
          <ListTodo className="h-4 w-4 text-[var(--app-accent)]" aria-hidden />
          {hasDraft && engagement !== "complete" ? "Review draft" : "Backlog"}
        </Link>
      ) : showResumeAiLink ? (
        <Link
          href={`/projects/${project.id}/brief`}
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--app-sidebar-border)] bg-[var(--background)]/40 px-4 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:border-[var(--app-accent)]/40 hover:bg-[var(--app-nav-hover-bg)]"
        >
          <FileText className="h-4 w-4 text-[var(--app-accent)]" aria-hidden />
          AI Generation
        </Link>
      ) : null}
    </PageShell>
  );
}
