"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText } from "lucide-react";
import { PageShell } from "@/components/app/PageShell";
import { readAiBriefEngagement } from "@/lib/projects/ai-brief-storage";
import { useProjectsWorkspace } from "./ProjectsWorkspaceProvider";
import type { AiBriefEngagement } from "./project-types";

export function ProjectWorkspaceView({ projectId }: { projectId: string }) {
  const router = useRouter();
  const { projects, updateProject, projectsHydrated } = useProjectsWorkspace();
  const project = projects.find((p) => p.id === projectId);

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

  const showBriefLink =
    engagement === "dismissed" ||
    engagement === "complete" ||
    engagement === "skipped";

  let subtitle =
    "Use the sidebar for AI Generation, Backlog, Sprint, Kanban, and Team.";
  if (engagement === "pending") {
    subtitle = "Opening AI Generation…";
  } else if (engagement === "dismissed") {
    subtitle =
      "Continue whenever you’re ready — use the sidebar or the button below.";
  } else if (engagement === "skipped") {
    subtitle =
      "Generate epics and stories from the sidebar or below (session draft until DB exists).";
  } else if (engagement === "complete") {
    subtitle =
      "Run AI Generation again from the sidebar; confirmed items appear on Backlog for this session.";
  }

  return (
    <PageShell title={project.name} subtitle={subtitle}>
      {project.aiBriefEngagement === "pending" ? (
        <p className="text-sm text-[var(--app-text-muted)]">
          Redirecting to AI Generation…
        </p>
      ) : showBriefLink ? (
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
