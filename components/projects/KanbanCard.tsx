"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ProjectMember {
  user_id: string;
  full_name: string;
  email: string;
}

export interface TaskCard {
  id: string;
  story_id: string;
  project_id: string;
  title: string;
  description: string | null;
  priority: number | null;
  status: string;
  assigned_to: string | null;
  story_points: number | null;
  story_title: string | null;
}

const PRIORITY_CONFIG: Record<number, { label: string; dot: string }> = {
  0: { label: "Low",      dot: "bg-zinc-600" },
  1: { label: "Medium",   dot: "bg-sky-500" },
  2: { label: "High",     dot: "bg-amber-400" },
  3: { label: "Critical", dot: "bg-red-500" },
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface KanbanCardProps {
  task: TaskCard;
  members: ProjectMember[];
  onOpenHUD: (task: TaskCard) => void;
}

export function KanbanCard({ task, members, onOpenHUD }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const p = task.priority ?? 0;
  const priority = PRIORITY_CONFIG[p] ?? PRIORITY_CONFIG[0];
  const assignee = members.find((m) => m.user_id === task.assigned_to) ?? null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative flex flex-col gap-2.5 rounded-xl border bg-[var(--auth-card)] p-3.5 shadow-sm",
        "transition-all duration-150",
        isDragging
          ? "opacity-40 scale-[0.98] border-[var(--app-accent)]/30"
          : "cursor-pointer border-[var(--app-sidebar-border)] hover:border-[var(--app-accent)]/40 hover:shadow-[0_0_0_1px_oklch(0.65_0.19_165_/_0.18),0_6px_20px_-6px_oklch(0.65_0.19_165_/_0.2)]"
      )}
      onClick={() => !isDragging && onOpenHUD(task)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onOpenHUD(task)}
      aria-label={`Open details for ${task.title}`}
    >
      {/* Drag handle — stops click propagation so dragging doesn't open HUD */}
      <button
        {...attributes}
        {...listeners}
        type="button"
        aria-label="Drag to reorder"
        onClick={(e) => e.stopPropagation()}
        className="absolute right-2.5 top-2.5 cursor-grab rounded p-0.5 text-zinc-600 opacity-0 transition-opacity group-hover:opacity-100 hover:text-zinc-400 active:cursor-grabbing"
      >
        <GripVertical className="h-3.5 w-3.5" aria-hidden />
      </button>

      {/* Title */}
      <p className="pr-6 text-sm font-medium leading-snug text-[var(--foreground)]">
        {task.title}
      </p>

      {/* Description */}
      {task.description ? (
        <p className="line-clamp-2 text-xs leading-relaxed text-zinc-500">
          {task.description}
        </p>
      ) : null}

      {/* Footer row: priority + story points + assignee */}
      <div className="flex items-center justify-between gap-2 pt-0.5">
        <div className="flex items-center gap-2">
          {/* Priority */}
          <div className="flex items-center gap-1.5">
            <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", priority.dot)} aria-hidden />
            <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
              {priority.label}
            </span>
          </div>

          {/* Story points */}
          {task.story_points !== null ? (
            <span className="rounded-md border border-zinc-700 bg-zinc-800/60 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-400">
              {task.story_points} pt{task.story_points !== 1 ? "s" : ""}
            </span>
          ) : null}
        </div>

        {/* Assignee avatar */}
        {assignee ? (
          <div
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--app-accent)]/20 text-[9px] font-bold text-[var(--app-accent)] ring-1 ring-[var(--app-accent)]/30"
            title={assignee.full_name}
            aria-label={`Assigned to ${assignee.full_name}`}
          >
            {getInitials(assignee.full_name)}
          </div>
        ) : (
          <div
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-dashed border-zinc-700 text-zinc-700"
            aria-label="Unassigned"
          >
            <span className="text-[10px]">+</span>
          </div>
        )}
      </div>
    </div>
  );
}