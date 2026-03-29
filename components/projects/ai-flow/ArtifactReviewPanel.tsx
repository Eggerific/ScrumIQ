"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Kanban,
  ListChecks,
  ListTodo,
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
import { GreenBeamPanel } from "./GreenBeamPanel";
import { SECONDARY_BTN_CLASS } from "./flow-constants";

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

const epicMotion = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, scale: 0.98 },
};

const inlineInput =
  "w-full rounded-lg border-2 border-violet-600 bg-violet-950 px-3 py-2.5 text-base leading-relaxed text-zinc-100 placeholder:text-zinc-500 outline-none transition-colors focus:border-[var(--app-accent)] focus:ring-2 focus:ring-[var(--app-accent)]/30";

const inlineInputStory =
  "w-full rounded-lg border-2 border-emerald-600 bg-emerald-950 px-3 py-2.5 text-base leading-relaxed text-zinc-100 placeholder:text-zinc-500 outline-none transition-colors focus:border-[var(--app-accent)] focus:ring-2 focus:ring-[var(--app-accent)]/30";

const inlineInputAc =
  "min-h-[3.25rem] w-full resize-y rounded-lg border-2 border-amber-600 bg-amber-950 px-3 py-2 text-base leading-relaxed text-amber-50 placeholder:text-amber-300/80 outline-none transition-colors focus:border-amber-400 focus:ring-2 focus:ring-amber-400/35";

const inlineInputTask =
  "min-h-[3rem] w-full resize-y rounded-lg border-2 border-sky-600 bg-sky-950 px-3 py-2 text-base leading-relaxed text-sky-50 placeholder:text-sky-300/80 outline-none transition-colors focus:border-sky-400 focus:ring-2 focus:ring-sky-400/35";

export interface ArtifactReviewPanelProps {
  initialDraft: AiBacklogDraftPayload;
  projectId: string;
  onConfirm: (draft: AiBacklogDraftPayload) => void;
}

export function ArtifactReviewPanel({
  initialDraft,
  projectId,
  onConfirm,
}: ArtifactReviewPanelProps) {
  const [data, setData] = useState<AiBacklogDraftPayload>(() =>
    structuredClone(initialDraft)
  );

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
  }, []);

  const addEpic = useCallback(() => {
    setData((d) => ({ ...d, epics: [...d.epics, emptyEpic()] }));
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
                  className="h-7 w-7 shrink-0 text-[var(--app-accent)]"
                  aria-hidden
                />
                <h2 className="text-xl font-semibold tracking-tight text-[var(--foreground)] md:text-2xl">
                  Review backlog
                </h2>
              </div>
              <p className="mt-4 max-w-3xl text-base leading-relaxed text-zinc-400 md:text-[1.05rem]">
                Epics are violet cards; user stories are green; acceptance
                criteria are amber; tasks are blue. Edit or add items, then save
                to your session backlog. Your original project inputs cannot be
                changed from this step.
              </p>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-7 md:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {data.epics.map((epic, epicIndex) => (
              <motion.div
                key={epic.id}
                layout
                variants={epicMotion}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{
                  duration: 0.32,
                  delay: Math.min(epicIndex * 0.04, 0.24),
                  ease: [0.25, 0.1, 0.25, 1],
                }}
                className={cn(
                  "flex flex-col rounded-2xl border-2 border-violet-600 bg-violet-950 p-5 shadow-lg shadow-black/40",
                  "transition-[box-shadow,transform] duration-300 hover:shadow-[0_0_24px_-8px_oklch(0.55_0.15_290_/_0.45)]"
                )}
              >
                <div className="mb-4 flex items-start justify-between gap-2">
                  <span className="shrink-0 rounded-md border border-violet-500 bg-violet-900 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-violet-100">
                    Epic
                  </span>
                  <button
                    type="button"
                    onClick={() => removeEpic(epic.id)}
                    className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-red-500/15 hover:text-red-300"
                    aria-label="Remove epic"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <textarea
                  value={epic.title}
                  onChange={(e) =>
                    updateEpic(epic.id, { title: e.target.value })
                  }
                  rows={2}
                  className={cn(
                    inlineInput,
                    "mb-3 min-h-[3.25rem] resize-y font-semibold text-violet-100"
                  )}
                  aria-label="Epic title"
                />
                <textarea
                  value={epic.description}
                  onChange={(e) =>
                    updateEpic(epic.id, { description: e.target.value })
                  }
                  rows={4}
                  className={cn(
                    inlineInput,
                    "mb-5 min-h-[6rem] resize-y text-zinc-200"
                  )}
                  aria-label="Epic description"
                />

                <div className="space-y-4">
                  {epic.stories.map((story) => (
                    <motion.div
                      key={story.id}
                      layout
                      initial={{ opacity: 0.85 }}
                      animate={{ opacity: 1 }}
                      className="rounded-xl border-2 border-emerald-600 bg-emerald-950 p-4"
                    >
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-200">
                          <ListTodo className="h-3.5 w-3.5" aria-hidden />
                          User story
                        </span>
                        <button
                          type="button"
                          onClick={() => removeStory(epic.id, story.id)}
                          className="rounded p-1 text-zinc-500 hover:bg-red-500/15 hover:text-red-300"
                          aria-label="Remove story"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <textarea
                        value={story.title}
                        onChange={(e) =>
                          updateStory(epic.id, story.id, {
                            title: e.target.value,
                          })
                        }
                        rows={3}
                        className={cn(
                          inlineInputStory,
                          "mb-4 min-h-[4.5rem] resize-y font-medium text-emerald-50"
                        )}
                        aria-label="Story title"
                      />

                      <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-200">
                        <ListChecks className="h-3.5 w-3.5" aria-hidden />
                        Acceptance criteria
                      </div>
                      <ul className="mb-4 space-y-3">
                        <AnimatePresence initial={false}>
                          {story.acceptanceCriteria.map((ac, aci) => (
                            <motion.li
                              key={`${story.id}-ac-${aci}`}
                              layout
                              initial={{ opacity: 0, x: -6 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, height: 0 }}
                              className="flex items-start gap-2"
                            >
                              <span className="mt-2 shrink-0 flex h-7 w-7 items-center justify-center rounded-full border border-amber-600 bg-amber-900 text-xs font-bold text-amber-100">
                                {aci + 1}
                              </span>
                              <textarea
                                value={ac}
                                onChange={(e) =>
                                  updateAc(epic.id, story.id, aci, e.target.value)
                                }
                                rows={2}
                                className={inlineInputAc}
                                placeholder="Acceptance criterion"
                              />
                              <button
                                type="button"
                                onClick={() => removeAc(epic.id, story.id, aci)}
                                className="mt-1 shrink-0 self-start rounded p-1 text-zinc-500 hover:text-amber-200"
                                aria-label="Remove criterion"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </motion.li>
                          ))}
                        </AnimatePresence>
                      </ul>
                      <button
                        type="button"
                        onClick={() => addAc(epic.id, story.id)}
                        className="mb-3 flex w-full items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-amber-600 bg-amber-950 py-2 text-xs font-medium text-amber-100 transition-colors hover:border-amber-400 hover:bg-amber-900"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add criterion
                      </button>

                      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-sky-200">
                        Tasks
                      </div>
                      <ul className="space-y-3">
                        {story.tasks.map((task) => (
                          <li key={task.id} className="flex items-start gap-2">
                            <textarea
                              value={task.title}
                              onChange={(e) =>
                                updateTaskTitle(
                                  epic.id,
                                  story.id,
                                  task.id,
                                  e.target.value
                                )
                              }
                              rows={2}
                              className={inlineInputTask}
                              placeholder="Task"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                removeTask(epic.id, story.id, task.id)
                              }
                              className="mt-1 shrink-0 rounded p-1 text-zinc-500 hover:text-sky-200"
                              aria-label="Remove task"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </li>
                        ))}
                      </ul>
                      <button
                        type="button"
                        onClick={() => addTask(epic.id, story.id)}
                        className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-sky-600 bg-sky-950 py-2 text-xs font-medium text-sky-100 transition-colors hover:border-sky-400 hover:bg-sky-900"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add task
                      </button>
                    </motion.div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => addStory(epic.id)}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-emerald-600 bg-emerald-950 py-2.5 text-sm font-medium text-emerald-100 transition-colors hover:border-emerald-400 hover:bg-emerald-900"
                >
                  <Plus className="h-4 w-4" />
                  Add user story
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <motion.button
          type="button"
          layout
          onClick={addEpic}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-violet-500 bg-violet-950 py-4 text-base font-semibold text-violet-100 transition-colors hover:border-[var(--app-accent)] hover:bg-violet-900"
        >
          <Plus className="h-5 w-5" />
          Add epic
        </motion.button>
        </GreenBeamPanel>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="flex flex-col-reverse gap-4 sm:flex-row sm:justify-end"
      >
        <Link
          href={`/projects/${projectId}`}
          className={`${SECONDARY_BTN_CLASS} inline-flex items-center justify-center`}
        >
          Project home
        </Link>
        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onConfirm(data)}
          className="rounded-xl px-10 py-3.5 text-base font-semibold text-[var(--background)] shadow-lg shadow-emerald-900/30"
          style={{ background: "var(--app-accent)" }}
        >
          Add to backlog
        </motion.button>
      </motion.div>
    </div>
  );
}
