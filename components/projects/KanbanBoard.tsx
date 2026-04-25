"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { motion } from "framer-motion";
import { Loader2, AlertCircle, GitBranch } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { KanbanColumn, type ColumnStatus } from "./KanbanColumn";
import { KanbanCard, type TaskCard, type ProjectMember } from "./KanbanCard";
import { KanbanTaskHUD } from "./KanbanTaskHUD";

const COLUMNS: ColumnStatus[] = ["To Do", "In Progress", "Done"];

type TasksByStatus = Record<ColumnStatus, TaskCard[]>;

function groupByStatus(tasks: TaskCard[]): TasksByStatus {
  return {
    "To Do": tasks.filter((t) => t.status === "To Do"),
    "In Progress": tasks.filter((t) => t.status === "In Progress"),
    "Done": tasks.filter((t) => t.status === "Done"),
  };
}

interface KanbanBoardProps {
  projectId: string;
}

export function KanbanBoard({ projectId }: KanbanBoardProps) {
  const [tasksByStatus, setTasksByStatus] = useState<TasksByStatus>({
    "To Do": [],
    "In Progress": [],
    "Done": [],
  });
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<TaskCard | null>(null);
  const [hudTask, setHudTask] = useState<TaskCard | null>(null);
  const [hudOpen, setHudOpen] = useState(false);

  const pendingUpdate = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();

      // Fetch tasks whose parent story is in_sprint, joining story title + points
      const { data: tasksData, error: tasksError } = await supabase
        .from("tasks")
        .select(`
          id,
          story_id,
          project_id,
          title,
          description,
          priority,
          status,
          assigned_to,
          stories (
            title,
            story_points,
            in_sprint
          )
        `)
        .eq("project_id", projectId)
        .order("priority", { ascending: false });

      if (tasksError) {
        setError("Failed to load tasks. Please try again.");
        return;
      }

      // Filter to only tasks whose parent story is in_sprint and flatten story fields
      const tasks: TaskCard[] = (tasksData ?? [])
        .filter((row: any) => row.stories?.in_sprint === true)
        .map((row: any) => ({
          id: row.id,
          story_id: row.story_id,
          project_id: row.project_id,
          title: row.title,
          description: row.description,
          priority: row.priority,
          status: row.status,
          assigned_to: row.assigned_to,
          story_points: row.stories?.story_points ?? null,
          story_title: row.stories?.title ?? null,
        }));

      setTasksByStatus(groupByStatus(tasks));

      // Fetch project members joined with user details
      const { data: membersData, error: membersError } = await supabase
        .from("project_members")
        .select("user_id, users ( full_name, email )")
        .eq("project_id", projectId);

      if (!membersError && membersData) {
        const mapped: ProjectMember[] = (membersData as any[])
          .filter((m) => m.users)
          .map((m) => ({
            user_id: m.user_id,
            full_name: m.users.full_name ?? "Unknown",
            email: m.users.email ?? "",
          }));
        setMembers(mapped);
      }
    } catch {
      setError("Something went wrong loading the board.");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  function findColumnForTask(taskId: string): ColumnStatus | null {
    for (const col of COLUMNS) {
      if (tasksByStatus[col].some((t) => t.id === taskId)) return col;
    }
    return null;
  }

  function handleDragStart(event: DragStartEvent) {
    const taskId = event.active.id as string;
    const col = findColumnForTask(taskId);
    if (col) setActiveTask(tasksByStatus[col].find((t) => t.id === taskId) ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;
    const sourceCol = findColumnForTask(activeId);
    if (!sourceCol) return;

    const destCol: ColumnStatus = COLUMNS.includes(overId as ColumnStatus)
      ? (overId as ColumnStatus)
      : (findColumnForTask(overId) ?? sourceCol);

    if (sourceCol === destCol) {
      const oldIndex = tasksByStatus[sourceCol].findIndex((t) => t.id === activeId);
      const newIndex = tasksByStatus[destCol].findIndex((t) => t.id === overId);
      if (oldIndex === newIndex) return;
      setTasksByStatus((prev) => ({
        ...prev,
        [sourceCol]: arrayMove(prev[sourceCol], oldIndex, newIndex),
      }));
    } else {
      const task = tasksByStatus[sourceCol].find((t) => t.id === activeId);
      if (!task) return;
      const updatedTask = { ...task, status: destCol };

      setTasksByStatus((prev) => {
        const sourceList = prev[sourceCol].filter((t) => t.id !== activeId);
        const overIndex = prev[destCol].findIndex((t) => t.id === overId);
        const destList = [...prev[destCol]];
        overIndex >= 0
          ? destList.splice(overIndex, 0, updatedTask)
          : destList.push(updatedTask);
        return { ...prev, [sourceCol]: sourceList, [destCol]: destList };
      });

      if (pendingUpdate.current) clearTimeout(pendingUpdate.current);
      pendingUpdate.current = setTimeout(async () => {
        const supabase = createClient();
        const { error: updateError } = await supabase
          .from("tasks")
          .update({ status: destCol })
          .eq("id", activeId);
        if (updateError) {
          console.error("Failed to update task status:", updateError.message);
          void fetchData();
        }
      }, 400);
    }
  }

  function handleCardClick(task: TaskCard) {
    setHudTask(task);
    setHudOpen(true);
  }

  function handleTaskUpdated(updated: TaskCard) {
    setTasksByStatus((prev) => {
      const col = COLUMNS.find((c) => prev[c].some((t) => t.id === updated.id));
      if (!col) return prev;
      return { ...prev, [col]: prev[col].map((t) => (t.id === updated.id ? updated : t)) };
    });
    setHudTask(updated);
  }

  const totalTasks = COLUMNS.reduce((sum, col) => sum + tasksByStatus[col].length, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--app-accent)]" aria-hidden />
        <span className="ml-3 text-sm text-zinc-500">Loading sprint board…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <AlertCircle className="h-6 w-6 text-red-400" aria-hidden />
        <p className="text-sm text-zinc-400">{error}</p>
        <button
          type="button"
          onClick={() => void fetchData()}
          className="rounded-lg border border-[var(--app-sidebar-border)] px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-[var(--app-nav-hover-bg)]"
        >
          Try again
        </button>
      </div>
    );
  }

  if (totalTasks === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <GitBranch className="h-8 w-8 text-zinc-600" aria-hidden />
        <p className="text-base font-medium text-zinc-400">No sprint tasks yet</p>
        <p className="max-w-xs text-sm text-zinc-600">
          Mark stories as "in sprint" from the Backlog to populate the Kanban board.
        </p>
      </div>
    );
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
          className="flex gap-4 overflow-x-auto pb-4 md:gap-6"
        >
          {COLUMNS.map((col) => (
            <div key={col} className="w-[300px] shrink-0 md:w-[340px] lg:flex-1 lg:w-auto">
              <KanbanColumn
                status={col}
                tasks={tasksByStatus[col]}
                members={members}
                onCardClick={handleCardClick}
              />
            </div>
          ))}
        </motion.div>

        <DragOverlay dropAnimation={{ duration: 180, easing: "ease" }}>
          {activeTask ? (
            <div className="rotate-1 scale-105 opacity-95 shadow-2xl">
              <KanbanCard task={activeTask} members={members} onOpenHUD={() => {}} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <KanbanTaskHUD
        task={hudTask}
        members={members}
        open={hudOpen}
        onOpenChange={setHudOpen}
        onTaskUpdated={handleTaskUpdated}
      />
    </>
  );
}