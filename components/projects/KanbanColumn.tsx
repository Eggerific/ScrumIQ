"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { cn } from "@/lib/utils";
import { KanbanCard, type TaskCard, type ProjectMember } from "./KanbanCard";

export type ColumnStatus = "To Do" | "In Progress" | "Done";

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
  tasks: TaskCard[];
  members: ProjectMember[];
  onCardClick: (task: TaskCard) => void;
}

export function KanbanColumn({ status, tasks, members, onCardClick }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const config = COLUMN_CONFIG[status];

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-3">
      {/* Column header */}
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
          {tasks.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-[480px] flex-col gap-2.5 rounded-2xl border p-3 transition-all duration-200",
          config.glow,
          isOver
            ? "border-[var(--app-accent)]/50 bg-[var(--app-accent)]/5"
            : "border-[var(--app-sidebar-border)] bg-[var(--background)]/40"
        )}
      >
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <KanbanCard
              key={task.id}
              task={task}
              members={members}
              onOpenHUD={onCardClick}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-xs text-zinc-700">No tasks</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}