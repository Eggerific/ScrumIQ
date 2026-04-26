"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Layers, ListChecks, ListTodo } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { KanbanBoardStory } from "@/lib/projects/kanban-workflow";
import { STORY_PRIORITY_DISPLAY } from "@/lib/projects/story-priority-level";
import {
  acDisplayLines,
  taskDisplayLines,
} from "@/lib/projects/story-draft-lines";
import {
  EPIC_BADGE,
  BACKLOG_TX_TASK,
  BACKLOG_TX_AC,
} from "@/components/projects/ai-flow/backlog-display-styles";
import { KanbanStoryAssigneeMenu } from "@/components/projects/KanbanStoryAssigneeMenu";
import type { ProjectMember } from "@/components/projects/project-member";

export type { ProjectMember } from "@/components/projects/project-member";

/** Collapsed card preview only — full lists open in the story panel. */
const CARD_PREVIEW_MAX_TASK_LINES = 2;
const CARD_PREVIEW_MAX_AC_LINES = 2;
const CARD_PREVIEW_MAX_CHARS_PER_LINE = 72;

function clipPreviewLine(text: string, maxChars: number): string {
  const t = text.trim();
  if (t.length <= maxChars) return t;
  if (maxChars <= 1) return "…";
  return `${t.slice(0, maxChars - 1)}…`;
}

interface KanbanCardProps {
  story: KanbanBoardStory;
  members: ProjectMember[];
  onOpen: (story: KanbanBoardStory) => void;
  onPersistStoryPatch: (
    storyId: string,
    patch: {
      description?: string;
      acceptance_criteria?: string;
      assigned_to?: string | null;
      board_status?: "To Do" | "In Progress" | "Done";
      notes?: string;
      task_titles?: string[];
      priority_level?: 0 | 1 | 2 | 3;
    }
  ) => Promise<boolean>;
}

export function KanbanCard({
  story,
  members,
  onOpen,
  onPersistStoryPatch,
}: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: story.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
  };

  const [savedFlash, setSavedFlash] = useState(false);
  const savedTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (savedTimerRef.current != null) window.clearTimeout(savedTimerRef.current);
    };
  }, []);

  const flashSaved = useCallback(() => {
    if (savedTimerRef.current != null) window.clearTimeout(savedTimerRef.current);
    setSavedFlash(true);
    savedTimerRef.current = window.setTimeout(() => {
      savedTimerRef.current = null;
      setSavedFlash(false);
    }, 2000);
  }, []);

  const priority =
    STORY_PRIORITY_DISPLAY[story.priority_level] ?? STORY_PRIORITY_DISPLAY[0];

  const taskPreviewLines = taskDisplayLines(story);
  const acPreviewLines = acDisplayLines(story.acceptance_criteria);
  const visibleTasks = taskPreviewLines.slice(0, CARD_PREVIEW_MAX_TASK_LINES);
  const hiddenTaskCount = taskPreviewLines.length - visibleTasks.length;
  const visibleAc = acPreviewLines.slice(0, CARD_PREVIEW_MAX_AC_LINES);
  const hiddenAcCount = acPreviewLines.length - visibleAc.length;

  const handleAssignee = useCallback(
    async (userId: string | null) => {
      if (userId === story.assigned_to) return;
      const ok = await onPersistStoryPatch(story.id, { assigned_to: userId });
      if (ok) flashSaved();
    },
    [story.id, story.assigned_to, onPersistStoryPatch, flashSaved]
  );

  const openStory = useCallback(() => {
    onOpen(story);
  }, [onOpen, story]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative flex min-w-0 max-w-full shrink-0 flex-col gap-2.5 overflow-x-hidden rounded-xl border bg-[var(--auth-card)] p-3.5 shadow-sm",
        "transition-all duration-150",
        isDragging
          ? "opacity-40 scale-[0.98] border-[var(--app-accent)]/30"
          : "border-[var(--app-sidebar-border)] hover:border-[var(--app-accent)]/40 hover:shadow-[0_0_0_1px_oklch(0.65_0.19_165_/_0.18),0_6px_20px_-6px_oklch(0.65_0.19_165_/_0.2)]"
      )}
    >
      <button
        {...attributes}
        {...listeners}
        type="button"
        aria-label="Drag to move story"
        onClick={(e) => e.stopPropagation()}
        className="absolute right-2.5 top-2.5 z-[1] cursor-grab rounded p-0.5 text-zinc-600 opacity-0 transition-opacity group-hover:opacity-100 hover:text-zinc-400 active:cursor-grabbing"
      >
        <GripVertical className="h-3.5 w-3.5" aria-hidden />
      </button>

      <div
        tabIndex={0}
        aria-label={`${story.title}. Open story details.`}
        className="min-w-0 cursor-pointer rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-accent)]/40"
        onClick={openStory}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openStory();
          }
        }}
      >
        <div className="flex flex-wrap items-center gap-2 pr-6">
          <Badge
            variant="outline"
            className={cn(
              EPIC_BADGE,
              "max-w-full truncate border-[#874e94]/40 text-xs font-normal"
            )}
            title={story.epic_title}
          >
            <Layers className="mr-1 size-3 shrink-0 opacity-80" aria-hidden />
            {story.epic_title}
          </Badge>
        </div>
        <p className="mt-1.5 line-clamp-2 break-words text-sm font-medium leading-snug text-[var(--foreground)]">
          {story.title}
        </p>

        <div
          className="mt-2.5 min-w-0 space-y-3 break-words rounded-lg border border-[var(--app-sidebar-border)] bg-[var(--background)]/45 p-2.5 text-left shadow-[inset_0_1px_0_0_oklch(0.25_0.02_260_/_0.35)]"
          role="group"
          aria-label="Tasks and acceptance criteria preview"
        >
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-zinc-500">
              <ListTodo className="size-3 shrink-0 opacity-90" aria-hidden />
              Tasks
            </div>
            {taskPreviewLines.length === 0 ? (
              <p className="text-xs italic text-zinc-500">None yet — open to edit</p>
            ) : (
              <>
                <ul className="space-y-1.5">
                  {visibleTasks.map((line, i) => (
                    <li
                      key={`t-${i}`}
                      className={cn(
                        "rounded-md border px-2 py-1.5 text-xs leading-snug break-words",
                        BACKLOG_TX_TASK
                      )}
                    >
                      {clipPreviewLine(line, CARD_PREVIEW_MAX_CHARS_PER_LINE)}
                    </li>
                  ))}
                </ul>
                {hiddenTaskCount > 0 ? (
                  <p className="mt-1.5 text-[10px] font-medium text-zinc-500">
                    +{hiddenTaskCount} more task{hiddenTaskCount !== 1 ? "s" : ""} — open card
                  </p>
                ) : null}
              </>
            )}
          </div>
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-zinc-500">
              <ListChecks className="size-3 shrink-0 opacity-90" aria-hidden />
              Acceptance criteria
            </div>
            {acPreviewLines.length === 0 ? (
              <p className="text-xs italic text-zinc-500">None yet — open to edit</p>
            ) : (
              <>
                <ul className="space-y-1.5">
                  {visibleAc.map((line, i) => (
                    <li
                      key={`ac-${i}`}
                      className={cn(
                        "rounded-md border px-2 py-1.5 text-xs leading-snug break-words",
                        BACKLOG_TX_AC
                      )}
                    >
                      {clipPreviewLine(line, CARD_PREVIEW_MAX_CHARS_PER_LINE)}
                    </li>
                  ))}
                </ul>
                {hiddenAcCount > 0 ? (
                  <p className="mt-1.5 text-[10px] font-medium text-zinc-500">
                    +{hiddenAcCount} more — open card
                  </p>
                ) : null}
              </>
            )}
          </div>
        </div>

        <div className="mt-2.5 flex min-w-0 flex-wrap items-start justify-between gap-2 border-t border-[var(--app-sidebar-border)]/60 pt-2">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            {savedFlash ? (
              <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-400" aria-live="polite">
                Saved
              </span>
            ) : null}
            <div className="flex items-center gap-1.5">
              <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", priority.dotClass)} aria-hidden />
              <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                {priority.label}
              </span>
            </div>
            {story.story_points != null ? (
              <span className="rounded-md border border-zinc-700 bg-zinc-800/60 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-400">
                {story.story_points} pt{story.story_points !== 1 ? "s" : ""}
              </span>
            ) : (
              <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-600">
                No pts
              </span>
            )}
          </div>
          <div
            className="min-w-0 max-w-[min(100%,220px)] shrink-0 basis-[min(100%,11rem)]"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <KanbanStoryAssigneeMenu
              members={members}
              assignedTo={story.assigned_to}
              onPick={(id) => void handleAssignee(id)}
              compact
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export type { KanbanBoardStory } from "@/lib/projects/kanban-workflow";
