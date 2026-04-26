"use client";

import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { KanbanCard, type KanbanBoardStory } from "./KanbanCard";
import type { ProjectMember } from "./project-member";
import type { KanbanWorkflowColumn } from "@/lib/projects/kanban-workflow";

export type ColumnStatus = KanbanWorkflowColumn;

const COLUMN_CONFIG: Record<ColumnStatus, { accent: string; badge: string; glow: string }> = {
  "To Do": {
    accent: "text-zinc-400",
    badge: "bg-zinc-800 text-zinc-400 border-zinc-700",
    glow: "",
  },
  "In Progress": {
    accent: "text-sky-400",
    badge: "bg-sky-500/10 text-sky-400 border-sky-800",
    glow: "shadow-[inset_0_1px_0_0_oklch(0.6_0.2_230_/_0.15)]",
  },
  "Done": {
    accent: "text-emerald-400",
    badge: "bg-emerald-500/10 text-emerald-400 border-emerald-800",
    glow: "shadow-[inset_0_1px_0_0_oklch(0.65_0.19_165_/_0.15)]",
  },
};

interface KanbanColumnProps {
  status: ColumnStatus;
  stories: KanbanBoardStory[];
  members: ProjectMember[];
  onCardClick: (story: KanbanBoardStory) => void;
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

export function KanbanColumn({
  status,
  stories,
  members,
  onCardClick,
  onPersistStoryPatch,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const config = COLUMN_CONFIG[status];

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
      <div className="flex items-center justify-between px-1">
        <h3 className={cn("text-sm font-semibold tracking-wide", config.accent)}>
          {status}
        </h3>
        <span
          className={cn(
            "rounded-md border px-2 py-0.5 text-xs font-semibold tabular-nums",
            config.badge
          )}
        >
          {stories.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "app-scrollbar flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto overflow-x-hidden rounded-2xl border p-3 transition-all duration-200",
          config.glow,
          isOver
            ? "border-[var(--app-accent)]/50 bg-[var(--app-accent)]/5"
            : "border-[var(--app-sidebar-border)] bg-[var(--background)]/40"
        )}
      >
        {stories.map((story) => (
          <KanbanCard
            key={story.id}
            story={story}
            members={members}
            onOpen={onCardClick}
            onPersistStoryPatch={onPersistStoryPatch}
          />
        ))}

        {stories.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-xs text-zinc-700">No stories</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
