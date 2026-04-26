"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  AlertCircle,
  Layers,
  ListChecks,
  ListTodo,
  User,
  FileText,
  Plus,
  Trash2,
  ChevronRight,
  Signal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { patchStory } from "@/lib/projects/patch-story-client";
import type { KanbanBoardStory } from "@/lib/projects/kanban-workflow";
import {
  STORY_PRIORITY_DISPLAY,
  STORY_PRIORITY_LEVELS,
  type StoryPriorityLevel,
} from "@/lib/projects/story-priority-level";
import type { ProjectMember } from "@/components/projects/project-member";
import {
  fingerprintLines,
  persistAcLines,
  persistTaskTitles,
  taskLinesDraftFromStory,
  acLinesDraftFromStory,
} from "@/lib/projects/story-draft-lines";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  EPIC_BADGE,
  BACKLOG_TX_TASK,
  BACKLOG_TX_AC,
  BACKLOG_TX_NOTES,
} from "@/components/projects/ai-flow/backlog-display-styles";
import { ExpandableBacklogText } from "@/components/projects/ExpandableBacklogText";
import { KanbanStoryAssigneeMenu } from "@/components/projects/KanbanStoryAssigneeMenu";

const easeSmooth = [0.25, 0.1, 0.25, 1] as const;

const FIBONACCI = [1, 2, 3, 5, 8, 13, 21] as const;

const backlogTextareaShell =
  "min-w-0 w-full rounded-lg px-2.5 py-2 text-sm leading-relaxed outline-none transition-[border-color,box-shadow]";

interface KanbanStoryPanelProps {
  projectId: string;
  story: KanbanBoardStory | null;
  members: ProjectMember[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStoryUpdated: (updated: KanbanBoardStory) => void;
}

function newClientId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function KanbanStoryPanel({
  projectId,
  story,
  members,
  open,
  onOpenChange,
  onStoryUpdated,
}: KanbanStoryPanelProps) {
  const router = useRouter();
  const titleId = useId();
  const mounted = typeof document !== "undefined";
  const closeRef = useRef<HTMLButtonElement>(null);
  const autoSaveTimerRef = useRef<number | null>(null);
  const handleSaveRef = useRef<() => Promise<boolean>>(async () => true);
  const isSavingRef = useRef(false);

  const [storyPoints, setStoryPoints] = useState<number | null>(null);
  const [taskLines, setTaskLines] = useState<string[]>([""]);
  const [acLines, setAcLines] = useState<string[]>([""]);
  const [notesBody, setNotesBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const storyHydrateKey = story
    ? `${story.id}|${story.epic_title}|${fingerprintLines(taskLinesDraftFromStory(story))}|${fingerprintLines(acLinesDraftFromStory(story.acceptance_criteria))}|${story.notes ?? ""}|${story.story_points ?? ""}|${story.assigned_to ?? ""}|${story.board_status}|${JSON.stringify(story.tasks.map((t) => ({ id: t.id, title: t.title })))}`
    : "";

  useEffect(() => {
    if (!open || !story) return;
    setStoryPoints(story.story_points ?? null);
    setTaskLines(taskLinesDraftFromStory(story));
    setAcLines(acLinesDraftFromStory(story.acceptance_criteria));
    setNotesBody(story.notes ?? "");
    setSaveError(null);
    setSaved(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `storyHydrateKey` carries the meaningful story snapshot; `story` omitted to avoid resets when the parent replaces object identity without content changes.
  }, [open, storyHydrateKey]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => closeRef.current?.focus(), 50);
    return () => {
      document.body.style.overflow = prev;
      window.clearTimeout(t);
    };
  }, [open]);

  useEffect(() => {
    if (autoSaveTimerRef.current != null) {
      window.clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
  }, [open, story?.id]);

  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current != null) {
        window.clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
    };
  }, []);

  const handleAssignee = useCallback(
    async (userId: string | null) => {
      if (!story) return;
      if (userId === story.assigned_to) return;
      const r = await patchStory(projectId, story.id, { assigned_to: userId });
      if (!r.ok) {
        setSaveError(r.message);
        return;
      }
      setSaveError(null);
      onStoryUpdated({ ...story, assigned_to: userId });
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2000);
    },
    [projectId, story, onStoryUpdated]
  );

  const handlePriorityLevel = useCallback(
    async (level: StoryPriorityLevel) => {
      if (!story) return;
      if (level === story.priority_level) return;
      const r = await patchStory(projectId, story.id, { priority_level: level });
      if (!r.ok) {
        setSaveError(r.message);
        return;
      }
      setSaveError(null);
      onStoryUpdated({ ...story, priority_level: level });
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2000);
    },
    [projectId, story, onStoryUpdated]
  );

  function updateTaskLine(index: number, value: string) {
    setTaskLines((prev) => prev.map((t, i) => (i === index ? value : t)));
  }

  function addTaskLine() {
    setTaskLines((prev) => [...prev, ""]);
  }

  function removeTaskLine(index: number) {
    setTaskLines((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.length > 0 ? next : [""];
    });
  }

  function updateAcLine(index: number, value: string) {
    setAcLines((prev) => prev.map((t, i) => (i === index ? value : t)));
  }

  function addAcLine() {
    setAcLines((prev) => [...prev, ""]);
  }

  function removeAcLine(index: number) {
    setAcLines((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.length > 0 ? next : [""];
    });
  }

  async function handleSave(): Promise<boolean> {
    if (!story) return true;
    const pointsChanged = storyPoints !== story.story_points;
    const tasksDirty =
      fingerprintLines(taskLines) !==
      fingerprintLines(taskLinesDraftFromStory(story));
    const nextAc = persistAcLines(acLines);
    const acDirty = nextAc !== (story.acceptance_criteria ?? "");
    const notesDirty = notesBody !== (story.notes ?? "");
    if (!pointsChanged && !tasksDirty && !acDirty && !notesDirty) return true;
    if (isSavingRef.current) return false;

    isSavingRef.current = true;
    setSaving(true);
    setSaveError(null);
    setSaved(false);

    try {
      const payload: {
        story_points?: number | null;
        acceptance_criteria?: string;
        notes?: string;
        task_titles?: string[];
      } = {};
      if (pointsChanged) payload.story_points = storyPoints;
      if (tasksDirty) payload.task_titles = persistTaskTitles(taskLines);
      if (acDirty) payload.acceptance_criteria = nextAc;
      if (notesDirty) payload.notes = notesBody;

      const r = await patchStory(projectId, story.id, payload);
      if (!r.ok) {
        setSaveError(r.message);
        return false;
      }

      const titles = persistTaskTitles(taskLines);
      const nextTasks = titles.map((title, i) => ({
        id: story.tasks[i]?.id ?? newClientId(),
        title,
        priority: i,
      }));

      setSaved(true);
      onStoryUpdated({
        ...story,
        ...(pointsChanged ? { story_points: storyPoints } : {}),
        ...(tasksDirty ? { description: "", tasks: nextTasks } : {}),
        ...(acDirty ? { acceptance_criteria: nextAc } : {}),
        ...(notesDirty ? { notes: notesBody } : {}),
      });
      window.setTimeout(() => setSaved(false), 2000);
      return true;
    } finally {
      setSaving(false);
      isSavingRef.current = false;
    }
  }

  handleSaveRef.current = handleSave;

  const scheduleAutoSaveAfterBlur = useCallback(() => {
    if (!open) return;
    if (autoSaveTimerRef.current != null) {
      window.clearTimeout(autoSaveTimerRef.current);
    }
    autoSaveTimerRef.current = window.setTimeout(() => {
      autoSaveTimerRef.current = null;
      void handleSaveRef.current();
    }, 450);
  }, [open]);

  const closePanel = useCallback(async (): Promise<boolean> => {
    if (autoSaveTimerRef.current != null) {
      window.clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
    const ok = await handleSaveRef.current();
    if (ok) onOpenChange(false);
    return ok;
  }, [onOpenChange]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") void closePanel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, closePanel]);

  const pointsChanged =
    story != null && storyPoints !== story.story_points;
  const tasksDirty =
    story != null &&
    fingerprintLines(taskLines) !==
      fingerprintLines(taskLinesDraftFromStory(story));
  const acDirty =
    story != null &&
    persistAcLines(acLines) !== (story.acceptance_criteria ?? "");
  const notesDirty = story != null && notesBody !== (story.notes ?? "");
  const dirty =
    pointsChanged || tasksDirty || acDirty || notesDirty;

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && story ? (
        <motion.div
          key="story-panel-layer"
          className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: easeSmooth }}
        >
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0 border-0 bg-black/60 backdrop-blur-[2px]"
            onClick={() => void closePanel()}
          />

          <motion.div
            role="dialog"
            aria-modal
            aria-labelledby={titleId}
            className="relative z-10 flex max-h-[min(90dvh,900px)] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-[var(--app-sidebar-border)] bg-[var(--auth-card)] shadow-2xl sm:max-h-[85vh] sm:rounded-2xl"
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.32, ease: easeSmooth }}
          >
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[var(--app-sidebar-border)] px-5 py-4">
              <div className="min-w-0 flex-1">
                <h2
                  id={titleId}
                  className="text-base font-semibold leading-snug text-[var(--foreground)]"
                >
                  {story.title}
                </h2>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className={cn(
                      EPIC_BADGE,
                      "max-w-full truncate border-[#874e94]/40 text-xs font-normal"
                    )}
                  >
                    <Layers className="mr-1 size-3 shrink-0 opacity-80" aria-hidden />
                    {story.epic_title}
                  </Badge>
                </div>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={() => void closePanel()}
                className="shrink-0 rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-[var(--app-nav-hover-bg)] hover:text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--app-accent)]"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>

            <div className="app-scrollbar min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-5 py-5">
              <div className="flex flex-col gap-5">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Story points
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {FIBONACCI.map((n) => (
                      <Button
                        key={n}
                        type="button"
                        variant="outline"
                        size="sm"
                        className={cn(
                          "h-8 min-w-9 px-2 text-xs font-semibold",
                          storyPoints === n
                            ? "border-[var(--app-accent)]/60 bg-[color-mix(in_oklch,var(--app-accent),transparent_78%)] text-emerald-50"
                            : "border-zinc-600/40 bg-zinc-900/30 text-zinc-300 hover:bg-zinc-800/50"
                        )}
                        aria-pressed={storyPoints === n}
                        onClick={() =>
                          setStoryPoints(storyPoints === n ? null : n)
                        }
                      >
                        {n}
                      </Button>
                    ))}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-xs text-zinc-500 hover:text-zinc-300"
                      onClick={() => setStoryPoints(null)}
                    >
                      Clear
                    </Button>
                  </div>
                </div>

                <div>
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    <Signal className="h-3.5 w-3.5" aria-hidden />
                    Priority
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {STORY_PRIORITY_LEVELS.map((level) => {
                      const meta = STORY_PRIORITY_DISPLAY[level];
                      const selected = story.priority_level === level;
                      return (
                        <Button
                          key={level}
                          type="button"
                          variant="outline"
                          size="sm"
                          className={cn(
                            "h-8 px-2.5 text-xs font-semibold",
                            selected
                              ? "border-zinc-500/70 bg-zinc-800/80 text-zinc-100"
                              : "border-zinc-600/40 bg-zinc-900/30 text-zinc-400 hover:bg-zinc-800/50"
                          )}
                          aria-pressed={selected}
                          onClick={() => void handlePriorityLevel(level)}
                        >
                          <span className="flex items-center gap-1.5">
                            <span
                              className={cn(
                                "h-2 w-2 shrink-0 rounded-full",
                                meta.dotClass
                              )}
                              aria-hidden
                            />
                            {meta.label}
                          </span>
                        </Button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    <User className="h-3.5 w-3.5" aria-hidden />
                    Assignee
                  </p>
                  <KanbanStoryAssigneeMenu
                    members={members}
                    assignedTo={story.assigned_to}
                    onPick={(id) => void handleAssignee(id)}
                  />
                </div>

                <div
                  className="min-w-0 space-y-4 break-words rounded-lg border border-[var(--app-sidebar-border)] bg-[var(--background)]/45 p-3 text-left shadow-[inset_0_1px_0_0_oklch(0.25_0.02_260_/_0.35)]"
                  onClick={(e) => e.stopPropagation()}
                  role="group"
                  aria-label="Tasks and acceptance criteria"
                >
                  <div>
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#8ec0f0]">
                      <ListTodo className="size-3.5 shrink-0" aria-hidden />
                      Tasks
                    </div>
                    <ul className="space-y-3">
                      {taskLines.map((line, ti) => (
                        <li
                          key={`${story.id}-task-${ti}`}
                          className="flex items-start gap-2"
                        >
                          <span
                            className="mt-1.5 flex size-7 shrink-0 items-center justify-center rounded-md border border-[#4a8fd4]/40 bg-[#4a8fd4]/12 text-[#8ec0f0]"
                            aria-hidden
                          >
                            <ChevronRight className="size-3.5" strokeWidth={2.5} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <ExpandableBacklogText
                              value={line}
                              onChange={(v) => updateTaskLine(ti, v)}
                              rows={2}
                              textareaClassName={BACKLOG_TX_TASK}
                              emptyHint="Task — click + to edit"
                              enterKeyMode="newline"
                              keyboardHint
                              serverAutosaveHint
                              onFinishEditing={scheduleAutoSaveAfterBlur}
                              aria-label={`Task ${ti + 1}`}
                            />
                          </div>
                          <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center self-start pt-1.5">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              className="h-7 w-7 text-muted-foreground hover:text-[#8ec0f0]"
                              aria-label="Remove task"
                              onClick={() => removeTaskLine(ti)}
                            >
                              <Trash2 className="size-3.5" />
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
                      onClick={addTaskLine}
                    >
                      <Plus className="size-3.5" />
                      Add task
                    </Button>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#dfc48a]">
                      <ListChecks className="size-3.5 shrink-0" aria-hidden />
                      Acceptance criteria
                    </div>
                    <ul className="space-y-3">
                      <AnimatePresence initial={false}>
                        {acLines.map((ac, aci) => (
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
                                onChange={(v) => updateAcLine(aci, v)}
                                rows={2}
                                textareaClassName={BACKLOG_TX_AC}
                                emptyHint="Criterion — click + to edit"
                                enterKeyMode="newline"
                                keyboardHint
                                serverAutosaveHint
                                onFinishEditing={scheduleAutoSaveAfterBlur}
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
                                onClick={() => removeAcLine(aci)}
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </span>
                          </motion.li>
                        ))}
                      </AnimatePresence>
                    </ul>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-3 w-full border-dashed border-[#c9a45c]/40 bg-[#c9a45c]/8 text-[#f5e6c8] hover:bg-[#c9a45c]/15"
                      onClick={addAcLine}
                    >
                      <Plus className="size-3.5" />
                      Add criterion
                    </Button>
                  </div>
                </div>

                <div className="min-w-0">
                  <label
                    htmlFor={`${titleId}-notes`}
                    className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-zinc-500"
                  >
                    <FileText className="size-3 shrink-0 opacity-90" aria-hidden />
                    Description
                  </label>
                  <Textarea
                    id={`${titleId}-notes`}
                    value={notesBody}
                    onChange={(e) => setNotesBody(e.target.value)}
                    onBlur={() => scheduleAutoSaveAfterBlur()}
                    rows={5}
                    placeholder="Multi-line notes. Click outside or Save to persist to the project."
                    className={cn(backlogTextareaShell, BACKLOG_TX_NOTES)}
                    aria-label="Story description and notes"
                  />
                </div>

                <Link
                  href={`/projects/${projectId}/backlog`}
                  className="text-sm font-medium text-[var(--app-accent)] underline-offset-2 hover:underline"
                  onClick={(e) => {
                    e.preventDefault();
                    void (async () => {
                      const ok = await closePanel();
                      if (ok) router.push(`/projects/${projectId}/backlog`);
                    })();
                  }}
                >
                  Open product backlog →
                </Link>

                {saveError ? (
                  <p className="flex items-center gap-1.5 text-sm text-red-400" role="alert">
                    <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
                    {saveError}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="shrink-0 border-t border-[var(--app-sidebar-border)] px-5 py-4">
              <div className="flex w-full min-w-0 flex-wrap items-center gap-3">
                <div className="min-w-0 flex-1">
                  {saved ? (
                    <span className="text-sm font-medium text-emerald-400" aria-live="polite">
                      Saved
                    </span>
                  ) : (
                    <span className="text-xs text-zinc-500">
                      {dirty
                        ? "Unsaved changes — click Save, or finish a task/AC field (click outside) to save."
                        : "No changes to save."}
                    </span>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void closePanel()}
                    className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-[var(--app-nav-hover-bg)] hover:text-[var(--foreground)]"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleSaveRef.current()}
                    disabled={saving || !dirty}
                    className="inline-flex min-w-[72px] items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-40"
                    style={{
                      background: "var(--app-accent)",
                      color: "var(--background)",
                    }}
                  >
                    {saving ? "Saving…" : "Save"}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
