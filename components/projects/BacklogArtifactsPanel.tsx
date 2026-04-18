"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  ChevronRight,
  GitBranch,
  Kanban,
  ListChecks,
  ListTodo,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import type {
  AiBacklogDraftPayload,
  AiGeneratedEpic,
  AiGeneratedStory,
  AiGeneratedTask,
} from "@/lib/projects/ai-backlog-draft-types";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/client";
import { fetchProjectSprintStories } from "@/lib/projects/fetch-project-sprint-stories";
import { writeBacklogDraft } from "@/lib/projects/backlog-draft-storage";
import { patchStory } from "@/lib/projects/patch-story-client";
import { postProjectBacklogDraft } from "@/lib/projects/post-project-backlog-client";
import { notifyProjectBacklogSavedToDatabase } from "@/lib/projects/project-stories-sync-events";
import { setSprintStoriesCache } from "@/lib/projects/sprint-stories-session-cache";
import { ExpandableBacklogText } from "@/components/projects/ExpandableBacklogText";
import { GreenBeamPanel } from "@/components/projects/ai-flow/GreenBeamPanel";
import { SECONDARY_BTN_CLASS } from "@/components/projects/ai-flow/flow-constants";
import { EPIC_BADGE, epicShellClass } from "@/components/projects/ai-flow/backlog-display-styles";

function newId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function emptyTask(): AiGeneratedTask {
  return { id: newId(), title: "" };
}

function emptyStory(): AiGeneratedStory {
  return {
    id: newId(),
    title: "New user story",
    inSprint: false,
    acceptanceCriteria: [""],
    tasks: [emptyTask()],
  };
}

function emptyEpic(): AiGeneratedEpic {
  return {
    id: newId(),
    title: "New epic",
    description: "",
    stories: [emptyStory()],
  };
}

/**
 * Backlog review palette (hex arbitrary classes kept literal for Tailwind JIT)
 * Epic #874e94 · Stories var(--app-accent) green · Tasks #4a8fd4 · AC #c9a45c
 */
const txEpic =
  "min-h-[3.25rem] resize-y border-[#874e94]/40 bg-[#874e94]/12 text-zinc-100 placeholder:text-zinc-500 focus-visible:border-[#874e94]/75 focus-visible:ring-[#874e94]/25";

const txEpicDesc =
  "min-h-[6rem] resize-y border-[#874e94]/35 bg-[#874e94]/8 text-zinc-200 placeholder:text-zinc-500 focus-visible:border-[#874e94]/70";

const txStory =
  "min-h-[4.5rem] resize-y border-[var(--app-accent)]/45 bg-[color-mix(in_oklch,var(--app-accent),transparent_86%)] text-emerald-50 placeholder:text-emerald-200/55 focus-visible:border-[var(--app-accent)]/75 focus-visible:ring-[var(--app-accent)]/25";

const txAc =
  "min-h-[3.25rem] resize-y border-[#c9a45c]/40 bg-[#c9a45c]/10 text-amber-50 placeholder:text-amber-100/40 focus-visible:border-[#c9a45c]/65 focus-visible:ring-[#c9a45c]/18";

const txTask =
  "min-h-[3rem] resize-y border-[#4a8fd4]/45 bg-[#4a8fd4]/12 text-sky-50 placeholder:text-sky-100/35 focus-visible:border-[#4a8fd4]/70 focus-visible:ring-[#4a8fd4]/22";

export interface BacklogArtifactsPanelProps {
  initialDraft: AiBacklogDraftPayload;
  projectId: string;
  /** When true, edits are debounced to POST /backlog so Sprint and DB stay in sync. */
  isProjectOwner?: boolean;
}

export function BacklogArtifactsPanel({
  initialDraft,
  projectId,
  isProjectOwner = false,
}: BacklogArtifactsPanelProps) {
  const [data, setData] = useState<AiBacklogDraftPayload>(() =>
    structuredClone(initialDraft)
  );
  const [openEpics, setOpenEpics] = useState<string[]>(() =>
    initialDraft.epics.map((e) => e.id)
  );

  useEffect(() => {
    const t = window.setTimeout(() => {
      writeBacklogDraft(projectId, data);
    }, 450);
    return () => window.clearTimeout(t);
  }, [data, projectId]);

  const lastSavedJsonRef = useRef(JSON.stringify(initialDraft));
  const dataRef = useRef(data);
  dataRef.current = data;
  const [dbSyncState, setDbSyncState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [dbSyncError, setDbSyncError] = useState<string | null>(null);
  const [addingToSprintId, setAddingToSprintId] = useState<string | null>(null);
  const [sprintFeedback, setSprintFeedback] = useState<{
    kind: "success" | "error";
    message: ReactNode;
  } | null>(null);

  useEffect(() => {
    if (!sprintFeedback) return;
    const t = window.setTimeout(() => setSprintFeedback(null), 6500);
    return () => window.clearTimeout(t);
  }, [sprintFeedback]);

  useEffect(() => {
    if (!isProjectOwner || !projectId) return;
    if (data.epics.length === 0) return;

    const json = JSON.stringify(data);
    if (json === lastSavedJsonRef.current) return;

    setDbSyncState("idle");
    const t = window.setTimeout(() => {
      void (async () => {
        const payload = dataRef.current;
        const snapshot = JSON.stringify(payload);
        if (snapshot === lastSavedJsonRef.current) return;

        setDbSyncState("saving");
        setDbSyncError(null);
        const result = await postProjectBacklogDraft(projectId, payload);
        if (result.ok) {
          if (JSON.stringify(dataRef.current) === snapshot) {
            lastSavedJsonRef.current = snapshot;
            writeBacklogDraft(projectId, payload);
            notifyProjectBacklogSavedToDatabase(projectId);
            setDbSyncState("saved");
            window.setTimeout(() => setDbSyncState("idle"), 2200);
          } else {
            setDbSyncState("idle");
          }
        } else {
          setDbSyncState("error");
          setDbSyncError(result.message);
        }
      })();
    }, 1400);

    return () => window.clearTimeout(t);
  }, [data, isProjectOwner, projectId]);

  const updateEpic = useCallback((epicId: string, patch: Partial<AiGeneratedEpic>) => {
    setData((d) => ({
      ...d,
      epics: d.epics.map((e) => (e.id === epicId ? { ...e, ...patch } : e)),
    }));
  }, []);

  const removeEpic = useCallback((epicId: string) => {
    setData((d) => ({
      ...d,
      epics: d.epics.filter((e) => e.id !== epicId),
    }));
    setOpenEpics((prev) => prev.filter((id) => id !== epicId));
  }, []);

  const addEpic = useCallback(() => {
    const ne = emptyEpic();
    setData((d) => ({ ...d, epics: [...d.epics, ne] }));
    setOpenEpics((prev) => [...prev, ne.id]);
  }, []);

  const updateStory = useCallback(
    (epicId: string, storyId: string, patch: Partial<AiGeneratedStory>) => {
      setData((d) => ({
        ...d,
        epics: d.epics.map((e) => {
          if (e.id !== epicId) return e;
          return {
            ...e,
            stories: e.stories.map((s) =>
              s.id === storyId ? { ...s, ...patch } : s
            ),
          };
        }),
      }));
    },
    []
  );

  const addStory = useCallback((epicId: string) => {
    setData((d) => ({
      ...d,
      epics: d.epics.map((e) =>
        e.id === epicId
          ? { ...e, stories: [...e.stories, emptyStory()] }
          : e
      ),
    }));
  }, []);

  const removeStory = useCallback((epicId: string, storyId: string) => {
    setData((d) => ({
      ...d,
      epics: d.epics.map((e) => {
        if (e.id !== epicId) return e;
        const next = e.stories.filter((s) => s.id !== storyId);
        return { ...e, stories: next.length > 0 ? next : [emptyStory()] };
      }),
    }));
  }, []);

  const updateAc = useCallback(
    (epicId: string, storyId: string, index: number, value: string) => {
      setData((d) => ({
        ...d,
        epics: d.epics.map((e) => {
          if (e.id !== epicId) return e;
          return {
            ...e,
            stories: e.stories.map((s) => {
              if (s.id !== storyId) return s;
              const next = [...s.acceptanceCriteria];
              next[index] = value;
              return { ...s, acceptanceCriteria: next };
            }),
          };
        }),
      }));
    },
    []
  );

  const addAc = useCallback((epicId: string, storyId: string) => {
    setData((d) => ({
      ...d,
      epics: d.epics.map((e) => {
        if (e.id !== epicId) return e;
        return {
          ...e,
          stories: e.stories.map((s) =>
            s.id === storyId
              ? { ...s, acceptanceCriteria: [...s.acceptanceCriteria, ""] }
              : s
          ),
        };
      }),
    }));
  }, []);

  const removeAc = useCallback(
    (epicId: string, storyId: string, index: number) => {
      setData((d) => ({
        ...d,
        epics: d.epics.map((e) => {
          if (e.id !== epicId) return e;
          return {
            ...e,
            stories: e.stories.map((s) => {
              if (s.id !== storyId) return s;
              const next = s.acceptanceCriteria.filter((_, i) => i !== index);
              return {
                ...s,
                acceptanceCriteria: next.length > 0 ? next : [""],
              };
            }),
          };
        }),
      }));
    },
    []
  );

  const updateTaskTitle = useCallback(
    (epicId: string, storyId: string, taskId: string, title: string) => {
      setData((d) => ({
        ...d,
        epics: d.epics.map((e) => {
          if (e.id !== epicId) return e;
          return {
            ...e,
            stories: e.stories.map((s) => {
              if (s.id !== storyId) return s;
              return {
                ...s,
                tasks: s.tasks.map((t) =>
                  t.id === taskId ? { ...t, title } : t
                ),
              };
            }),
          };
        }),
      }));
    },
    []
  );

  const addTask = useCallback((epicId: string, storyId: string) => {
    setData((d) => ({
      ...d,
      epics: d.epics.map((e) => {
        if (e.id !== epicId) return e;
        return {
          ...e,
          stories: e.stories.map((s) =>
            s.id === storyId
              ? { ...s, tasks: [...s.tasks, emptyTask()] }
              : s
          ),
        };
      }),
    }));
  }, []);

  const removeTask = useCallback(
    (epicId: string, storyId: string, taskId: string) => {
      setData((d) => ({
        ...d,
        epics: d.epics.map((e) => {
          if (e.id !== epicId) return e;
          return {
            ...e,
            stories: e.stories.map((s) => {
              if (s.id !== storyId) return s;
              const next = s.tasks.filter((t) => t.id !== taskId);
              return {
                ...s,
                tasks: next.length > 0 ? next : [emptyTask()],
              };
            }),
          };
        }),
      }));
    },
    []
  );

  const handleAddToSprint = useCallback(
    async (epicId: string, story: AiGeneratedStory) => {
      if (story.inSprint) return;
      setAddingToSprintId(story.id);
      setSprintFeedback(null);
      const result = await patchStory(projectId, story.id, { in_sprint: true });
      setAddingToSprintId(null);
      if (!result.ok) {
        const msg =
          result.message.toLowerCase().includes("not found") ||
          result.message.includes("404")
            ? "This story isn’t in the project yet. Wait a few seconds for the backlog to finish saving, then try again."
            : result.message;
        setSprintFeedback({ kind: "error", message: msg });
        return;
      }
      updateStory(epicId, story.id, { inSprint: true });
      notifyProjectBacklogSavedToDatabase(projectId);
      void (async () => {
        const supabase = createClient();
        const rows = await fetchProjectSprintStories(supabase, projectId);
        if (rows) setSprintStoriesCache(projectId, rows);
      })();
      const label = story.title.trim() || "Story";
      const short = label.length > 72 ? `${label.slice(0, 69)}…` : label;
      setSprintFeedback({
        kind: "success",
        message: (
          <span className="flex gap-2.5">
            <Check
              className="mt-0.5 size-4 shrink-0 text-[var(--app-accent)]"
              aria-hidden
            />
            <span>
              <span className="font-medium">Added to sprint.</span>{" "}
              <q className="text-emerald-100/90">{short}</q>
              <span className="mt-1 block text-[13px] text-emerald-100/80">
                Open Sprint from the sidebar when you&apos;re ready.
              </span>
            </span>
          </span>
        ),
      });
    },
    [projectId, updateStory]
  );

  return (
    <div className="mx-auto max-w-[1500px] space-y-10 pb-8">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <GreenBeamPanel paddingClassName="p-6 md:p-10">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <div className="flex items-center gap-3">
                <Kanban
                  className="h-7 w-7 shrink-0 text-[#874e94]"
                  aria-hidden
                />
                <h2 className="text-xl font-semibold tracking-tight text-[var(--foreground)] md:text-2xl">
                  Backlog
                </h2>
              </div>
              <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground md:text-[1.05rem]">
                Click the + beside a field to expand and edit. Each story has an
                &quot;Add to sprint&quot; control that sends it to the Sprint
                page. Changes save to this browser session
                {isProjectOwner
                  ? " and, for project owners, to the database so Sprint stays up to date."
                  : "."}
              </p>
              {sprintFeedback ? (
                <div
                  role={sprintFeedback.kind === "error" ? "alert" : "status"}
                  aria-live="polite"
                  className={cn(
                    "mt-4 max-w-3xl rounded-xl border px-4 py-3 text-sm leading-relaxed",
                    sprintFeedback.kind === "success"
                      ? "border-[var(--app-accent)]/40 bg-[color-mix(in_oklch,var(--app-accent),transparent_90%)] text-emerald-50/95"
                      : "border-red-500/35 bg-red-950/45 text-red-100/95"
                  )}
                >
                  {sprintFeedback.message}
                </div>
              ) : null}
            </div>
          </div>

          <Accordion
            type="multiple"
            value={openEpics}
            onValueChange={(v) => setOpenEpics(v as string[])}
            className="mt-8 w-full space-y-5 rounded-xl border border-border/50 bg-muted/15 p-3 md:p-4"
          >
            {data.epics.map((epic, epicIndex) => (
              <AccordionItem
                key={epic.id}
                value={epic.id}
                className={epicShellClass(epicIndex)}
              >
                    <div className="flex items-center gap-1 border-b border-[#874e94]/20 bg-[#874e94]/10 px-3 py-1 md:px-4">
                      <AccordionTrigger className="min-h-0 flex-1 py-4 hover:no-underline [&>svg]:text-muted-foreground">
                        <div className="flex min-w-0 flex-1 flex-col items-start gap-2.5 text-left sm:flex-row sm:items-center">
                          <Badge
                            variant="outline"
                            className={cn(
                              "shrink-0 font-medium",
                              EPIC_BADGE
                            )}
                          >
                            Epic {epicIndex + 1}
                          </Badge>
                          <span className="line-clamp-2 min-w-0 text-base font-medium text-foreground">
                            {epic.title.trim() || "Untitled epic"}
                          </span>
                        </div>
                      </AccordionTrigger>
                      <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="h-7 w-7 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          aria-label="Remove epic"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            removeEpic(epic.id);
                          }}
                        >
                          <Trash2 className="size-4" aria-hidden />
                        </Button>
                      </span>
                    </div>
                    <AccordionContent className="border-t border-[#874e94]/12 bg-[#1a1020]/50 pb-1">
                      <ScrollArea className="h-[min(70vh,560px)] pr-3">
                        <div className="space-y-6 px-3 pb-4 pt-5 md:px-5">
                          <div className="space-y-3">
                            <label className="text-sm font-medium text-muted-foreground">
                              Epic title
                            </label>
                            <ExpandableBacklogText
                              value={epic.title}
                              onChange={(v) => updateEpic(epic.id, { title: v })}
                              rows={2}
                              textareaClassName={cn(txEpic, "font-semibold")}
                              emptyHint="Untitled epic — click + to edit"
                              aria-label="Epic title"
                            />
                            <label className="text-sm font-medium text-muted-foreground">
                              Description
                            </label>
                            <ExpandableBacklogText
                              value={epic.description}
                              onChange={(v) =>
                                updateEpic(epic.id, { description: v })
                              }
                              rows={4}
                              textareaClassName={txEpicDesc}
                              emptyHint="No description — click + to add"
                              aria-label="Epic description"
                            />
                          </div>

                          <Separator className="bg-[#874e94]/20" />

                          <div className="space-y-5">
                            {epic.stories.map((story, si) => (
                              <Card
                                key={story.id}
                                className="border border-[var(--app-accent)]/35 bg-[color-mix(in_oklch,var(--app-accent),transparent_92%)] shadow-sm ring-1 ring-[var(--app-accent)]/12"
                              >
                                <CardHeader className="border-b border-[var(--app-accent)]/18 pb-3">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0 flex-1 space-y-1">
                                      <Badge
                                        variant="outline"
                                        className="border-[var(--app-accent)]/40 bg-[color-mix(in_oklch,var(--app-accent),transparent_88%)] text-emerald-50"
                                      >
                                        <ListTodo
                                          className="mr-1 size-3"
                                          aria-hidden
                                        />
                                        User story
                                      </Badge>
                                      <CardTitle className="text-sm font-normal text-muted-foreground">
                                        Story {si + 1}
                                      </CardTitle>
                                    </div>
                                    <div className="flex shrink-0 items-center gap-1 pt-0.5">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={
                                          Boolean(story.inSprint) ||
                                          addingToSprintId === story.id
                                        }
                                        title={
                                          story.inSprint
                                            ? "Already in this sprint"
                                            : "Add this story to the sprint (same data the Kanban board will use later)"
                                        }
                                        onClick={() =>
                                          void handleAddToSprint(epic.id, story)
                                        }
                                        className={cn(
                                          "h-7 shrink-0 gap-1 rounded-full px-2.5 text-xs font-medium",
                                          story.inSprint
                                            ? "border-[var(--app-accent)]/45 bg-[color-mix(in_oklch,var(--app-accent),transparent_88%)] text-emerald-100"
                                            : "border-[var(--app-accent)]/35 text-emerald-100/95 hover:bg-[color-mix(in_oklch,var(--app-accent),transparent_82%)]"
                                        )}
                                      >
                                        {addingToSprintId === story.id ? (
                                          <Loader2
                                            className="size-3.5 animate-spin"
                                            aria-hidden
                                          />
                                        ) : story.inSprint ? (
                                          <Check
                                            className="size-3.5"
                                            aria-hidden
                                          />
                                        ) : (
                                          <GitBranch
                                            className="size-3.5 opacity-90"
                                            aria-hidden
                                          />
                                        )}
                                        {story.inSprint
                                          ? "In sprint"
                                          : "Add to sprint"}
                                      </Button>
                                      <span className="inline-flex h-7 w-7 items-center justify-center">
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="icon-sm"
                                          className="h-7 w-7 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                          aria-label="Remove story"
                                          onClick={() =>
                                            removeStory(epic.id, story.id)
                                          }
                                        >
                                          <Trash2 className="size-3.5" aria-hidden />
                                        </Button>
                                      </span>
                                    </div>
                                  </div>
                                  <div className="mt-2">
                                    <ExpandableBacklogText
                                      value={story.title}
                                      onChange={(v) =>
                                        updateStory(epic.id, story.id, {
                                          title: v,
                                        })
                                      }
                                      rows={3}
                                      textareaClassName={cn(
                                        txStory,
                                        "font-medium"
                                      )}
                                      emptyHint="Story title — click + to edit"
                                      aria-label="Story title"
                                    />
                                  </div>
                                </CardHeader>
                                <CardContent className="space-y-4 pt-4">
                                  <div>
                                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#dfc48a]">
                                      <ListChecks
                                        className="size-3.5"
                                        aria-hidden
                                      />
                                      Acceptance criteria
                                    </div>
                                    <ul className="space-y-3">
                                      <AnimatePresence initial={false}>
                                        {story.acceptanceCriteria.map(
                                          (ac, aci) => (
                                            <motion.li
                                              key={`${story.id}-ac-${aci}`}
                                              layout
                                              initial={{ opacity: 0, x: -6 }}
                                              animate={{ opacity: 1, x: 0 }}
                                              exit={{ opacity: 0, height: 0 }}
                                              className="flex items-start gap-2"
                                            >
                                              <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-[#c9a45c]/45 bg-[#c9a45c]/15 text-xs font-bold text-[#f5e6c8]">
                                                {aci + 1}
                                              </span>
                                              <div className="min-w-0 flex-1">
                                                <ExpandableBacklogText
                                                  value={ac}
                                                  onChange={(v) =>
                                                    updateAc(
                                                      epic.id,
                                                      story.id,
                                                      aci,
                                                      v
                                                    )
                                                  }
                                                  rows={2}
                                                  textareaClassName={txAc}
                                                  emptyHint="Criterion — click + to edit"
                                                  aria-label={`Acceptance criterion ${aci + 1}`}
                                                />
                                              </div>
                                              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center">
                                                <Button
                                                  type="button"
                                                  variant="ghost"
                                                  size="icon-sm"
                                                  className="h-7 w-7 text-muted-foreground hover:text-[#dfc48a]"
                                                  aria-label="Remove criterion"
                                                  onClick={() =>
                                                    removeAc(
                                                      epic.id,
                                                      story.id,
                                                      aci
                                                    )
                                                  }
                                                >
                                                  <Trash2 className="size-3.5" aria-hidden />
                                                </Button>
                                              </span>
                                            </motion.li>
                                          )
                                        )}
                                      </AnimatePresence>
                                    </ul>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="mt-3 w-full border-dashed border-[#c9a45c]/40 bg-[#c9a45c]/8 text-[#f5e6c8] hover:bg-[#c9a45c]/15"
                                      onClick={() =>
                                        addAc(epic.id, story.id)
                                      }
                                    >
                                      <Plus className="size-3.5" />
                                      Add criterion
                                    </Button>
                                  </div>

                                  <Separator className="bg-[var(--app-accent)]/12" />

                                  <div>
                                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#8ec0f0]">
                                      <ListTodo
                                        className="size-3.5"
                                        aria-hidden
                                      />
                                      Tasks
                                    </div>
                                    <ul className="space-y-3">
                                      {story.tasks.map((task) => (
                                        <li
                                          key={task.id}
                                          className="flex items-start gap-2"
                                        >
                                          <span
                                            className="mt-1.5 flex size-7 shrink-0 items-center justify-center rounded-md border border-[#4a8fd4]/40 bg-[#4a8fd4]/12 text-[#8ec0f0]"
                                            aria-hidden
                                          >
                                            <ChevronRight
                                              className="size-3.5"
                                              strokeWidth={2.5}
                                              aria-hidden
                                            />
                                          </span>
                                          <div className="min-w-0 flex-1">
                                            <ExpandableBacklogText
                                              value={task.title}
                                              onChange={(v) =>
                                                updateTaskTitle(
                                                  epic.id,
                                                  story.id,
                                                  task.id,
                                                  v
                                                )
                                              }
                                              rows={2}
                                              textareaClassName={txTask}
                                              emptyHint="Task — click + to edit"
                                              aria-label="Task"
                                            />
                                          </div>
                                          <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center self-start pt-1.5">
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="icon-sm"
                                              className="h-7 w-7 text-muted-foreground hover:text-[#8ec0f0]"
                                              aria-label="Remove task"
                                              onClick={() =>
                                                removeTask(
                                                  epic.id,
                                                  story.id,
                                                  task.id
                                                )
                                              }
                                            >
                                              <Trash2 className="size-3.5" aria-hidden />
                                            </Button>
                                          </span>
                                        </li>
                                      ))}
                                    </ul>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="mt-2 w-full border-dashed border-[#4a8fd4]/40 bg-[#4a8fd4]/8 text-sky-50 hover:bg-[#4a8fd4]/15"
                                      onClick={() =>
                                        addTask(epic.id, story.id)
                                      }
                                    >
                                      <Plus className="size-3.5" />
                                      Add task
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>

                          <Button
                            type="button"
                            variant="outline"
                            className="w-full border-dashed border-[var(--app-accent)]/40 bg-[color-mix(in_oklch,var(--app-accent),transparent_90%)] text-emerald-50 hover:bg-[color-mix(in_oklch,var(--app-accent),transparent_82%)]"
                            onClick={() => addStory(epic.id)}
                          >
                            <Plus className="size-4" />
                            Add user story
                          </Button>
                        </div>
                      </ScrollArea>
                    </AccordionContent>
                  </AccordionItem>
            ))}
          </Accordion>

          <Button
            type="button"
            variant="outline"
            size="lg"
            className="mt-8 w-full border-2 border-dashed border-[#874e94]/50 bg-[#874e94]/10 py-6 text-base font-semibold text-[#e9c7ee] hover:border-[#874e94]/70 hover:bg-[#874e94]/18"
            onClick={addEpic}
          >
            <Plus className="size-5" />
            Add epic
          </Button>
        </GreenBeamPanel>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="text-sm text-muted-foreground">
          <p>Session draft — edits sync to this tab automatically.</p>
          {isProjectOwner ? (
            <p className="mt-1.5 text-xs text-zinc-500">
              {dbSyncState === "saving" ? (
                <span className="text-zinc-400">Saving to database…</span>
              ) : dbSyncState === "saved" ? (
                <span className="text-[var(--app-accent)]/90">Saved to project</span>
              ) : dbSyncState === "error" && dbSyncError ? (
                <span className="text-red-300/95" role="alert">
                  Couldn&apos;t save to database: {dbSyncError}
                </span>
              ) : (
                <span>
                  Database sync runs shortly after you stop typing (project
                  owners only).
                </span>
              )}
            </p>
          ) : null}
        </div>
        <Link
          href={`/projects/${projectId}`}
          className={`${SECONDARY_BTN_CLASS} inline-flex shrink-0 items-center justify-center`}
        >
          Project home
        </Link>
      </motion.div>
    </div>
  );
}
