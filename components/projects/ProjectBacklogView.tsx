"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, Sparkles } from "lucide-react";
import { PageShell } from "@/components/app/PageShell";
import type { AiBacklogDraftPayload } from "@/lib/projects/ai-backlog-draft-types";
import { readBacklogDraft } from "@/lib/projects/backlog-draft-storage";
import { useProjectsWorkspace } from "@/components/projects/ProjectsWorkspaceProvider";
import { useEffect, useState } from "react";

/** Older session drafts used `sourceBriefMode` from the two-step flow. */
function draftLabelSource(d: AiBacklogDraftPayload): string {
  const x = d as AiBacklogDraftPayload & { sourceBriefMode?: string };
  return x.artifactSource ?? x.sourceBriefMode ?? "unknown";
}

export function ProjectBacklogView({ projectId }: { projectId: string }) {
  const router = useRouter();
  const { projects, projectsHydrated } = useProjectsWorkspace();
  const project = projects.find((p) => p.id === projectId);

  const [draft, setDraft] = useState<AiBacklogDraftPayload | null>(null);
  useEffect(() => {
    setDraft(readBacklogDraft(projectId));
  }, [projectId]);

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

  if (!draft || draft.epics.length === 0) {
    return (
      <PageShell
        title={`Backlog — ${project.name}`}
        subtitle="No generated backlog in this session yet. Run AI Generation and confirm “Add to backlog” to populate this view."
      >
        <Link
          href={`/projects/${projectId}/brief`}
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-[var(--background)]"
          style={{ background: "var(--app-accent)" }}
        >
          <Sparkles className="h-4 w-4" aria-hidden />
          Open AI Generation
        </Link>
      </PageShell>
    );
  }

  return (
    <PageShell
      title={`Backlog — ${project.name}`}
      subtitle={`Session draft generated ${new Date(draft.generatedAt).toLocaleString()} (source: ${draftLabelSource(draft)}). This is not persisted to a database yet.`}
    >
      <ul className="space-y-3">
        {draft.epics.map((epic) => (
          <li
            key={epic.id}
            className="rounded-xl border border-[var(--app-sidebar-border)] bg-[var(--auth-card)]/60"
          >
            <details open className="group">
              <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 [&::-webkit-details-marker]:hidden">
                <ChevronDown className="h-4 w-4 shrink-0 text-zinc-500 transition-transform group-open:rotate-180" />
                <span className="font-medium text-zinc-200">{epic.title}</span>
              </summary>
              <div className="border-t border-[var(--app-sidebar-border)]/60 px-4 py-3">
                <p className="text-sm text-zinc-500">{epic.description}</p>
                <ul className="mt-4 space-y-3">
                  {epic.stories.map((s) => (
                    <li
                      key={s.id}
                      className="rounded-lg border border-[var(--app-sidebar-border)]/50 bg-[var(--background)]/25 p-3"
                    >
                      <p className="text-sm font-medium text-zinc-200">{s.title}</p>
                      <p className="mt-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
                        Acceptance criteria
                      </p>
                      <ul className="mt-1 list-inside list-disc text-sm text-zinc-400">
                        {s.acceptanceCriteria.map((ac, i) => (
                          <li key={i}>{ac}</li>
                        ))}
                      </ul>
                      <p className="mt-3 text-xs font-medium uppercase tracking-wide text-zinc-500">
                        Tasks
                      </p>
                      <ul className="mt-1 space-y-1">
                        {s.tasks.map((t) => (
                          <li key={t.id} className="text-sm text-zinc-400">
                            · {t.title}
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              </div>
            </details>
          </li>
        ))}
      </ul>
    </PageShell>
  );
}
