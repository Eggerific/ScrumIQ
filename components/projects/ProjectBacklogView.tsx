"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles } from "lucide-react";
import { PageShell } from "@/components/app/PageShell";
import type { AiBacklogDraftPayload } from "@/lib/projects/ai-backlog-draft-types";
import { readBacklogDraft } from "@/lib/projects/backlog-draft-storage";
import { useProjectsWorkspace } from "@/components/projects/ProjectsWorkspaceProvider";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BacklogArtifactsPanel } from "@/components/projects/BacklogArtifactsPanel";
import { SECONDARY_BTN_CLASS } from "@/components/projects/ai-flow/flow-constants";

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

  if (!draft) {
    return (
      <PageShell
        title={`Backlog — ${project.name}`}
        subtitle="Nothing saved here yet. Use AI Generation to review your draft, then Add to backlog to store it on this page."
      >
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
          className="mx-auto max-w-lg"
        >
          <Card className="border-2 border-dashed border-[var(--app-accent)]/35 bg-[var(--auth-card)]/80 ring-1 ring-[var(--app-accent)]/15">
            <CardHeader className="space-y-2 pb-2">
              <div className="flex items-center gap-2 text-[var(--app-accent)]">
                <Sparkles className="size-6 shrink-0" aria-hidden />
                <CardTitle className="text-lg font-semibold text-zinc-100">
                  Generate and confirm a backlog
                </CardTitle>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Run AI Generation, edit on the review step, then add to backlog.
                You can keep refining items here with the + controls next to each
                field.
              </p>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button asChild size="lg" className="font-semibold shadow-md">
                <Link href={`/projects/${projectId}/brief`}>
                  <Sparkles className="size-4" aria-hidden />
                  Open AI Generation
                </Link>
              </Button>
              <Link
                href={`/projects/${projectId}`}
                className={`${SECONDARY_BTN_CLASS} inline-flex items-center justify-center px-6 py-3 text-sm`}
              >
                Project home
              </Link>
            </CardContent>
          </Card>
        </motion.div>
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
