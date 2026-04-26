"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { motion } from "framer-motion";
import { Loader2, AlertCircle, GitBranch } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { patchStory } from "@/lib/projects/patch-story-client";
import { subscribeProjectStoriesChanged } from "@/lib/projects/project-stories-sync-events";
import {
  deriveStoryBoardColumn,
  mapAndSortKanbanStoriesFromQuery,
  type KanbanBoardStory,
} from "@/lib/projects/kanban-workflow";
import { KanbanColumn, type ColumnStatus } from "./KanbanColumn";
import { KanbanCard } from "./KanbanCard";
import type { ProjectMember } from "./project-member";
import { KanbanStoryPanel } from "./KanbanStoryPanel";

const COLUMNS: ColumnStatus[] = ["To Do", "In Progress", "Done"];

function bucketStoriesByWorkflow(
  stories: KanbanBoardStory[]
): Record<ColumnStatus, KanbanBoardStory[]> {
  const acc: Record<ColumnStatus, KanbanBoardStory[]> = {
    "To Do": [],
    "In Progress": [],
    "Done": [],
  };
  for (const s of stories) {
    acc[deriveStoryBoardColumn(s)].push(s);
  }
  return acc;
}

interface KanbanBoardProps {
  projectId: string;
}

export function KanbanBoard({ projectId }: KanbanBoardProps) {
  const pathname = usePathname();
  const prevPathnameRef = useRef<string | null>(null);

  const [stories, setStories] = useState<KanbanBoardStory[]>([]);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeStory, setActiveStory] = useState<KanbanBoardStory | null>(null);
  const [panelStory, setPanelStory] = useState<KanbanBoardStory | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const pendingUpdate = useRef<number | null>(null);

  const storiesByStatus = useMemo(
    () => bucketStoriesByWorkflow(stories),
    [stories]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const fetchData = useCallback(async (opts?: { background?: boolean }) => {
    const background = opts?.background === true;
    if (!background) setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data, error: qError } = await supabase
        .from("stories")
        .select(
          "id, epic_id, title, story_points, in_sprint, priority, priority_level, board_status, assigned_to, description, notes, acceptance_criteria, epics ( title, priority ), tasks ( id, title, priority )"
        )
        .eq("project_id", projectId)
        .eq("in_sprint", true);

      if (qError) {
        setError("Failed to load sprint board. Please try again.");
        return;
      }

      setStories(mapAndSortKanbanStoriesFromQuery(data ?? []));

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
      if (!background) setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!pathname) return;
    const prev = prevPathnameRef.current;
    prevPathnameRef.current = pathname;
    if (prev === null) return;
    if (!pathname.includes(`/projects/${projectId}/kanban`)) return;
    void fetchData({ background: true });
  }, [pathname, projectId, fetchData]);

  useEffect(() => {
    return subscribeProjectStoriesChanged(projectId, () => {
      void fetchData({ background: true });
    });
  }, [projectId, fetchData]);

  useEffect(() => {
    if (!panelStory) return;
    const next = stories.find((s) => s.id === panelStory.id);
    if (!next) {
      if (panelOpen) setPanelOpen(false);
      setPanelStory(null);
      return;
    }
    if (!panelOpen) return;
    const tasksJson = JSON.stringify(next.tasks);
    const prevTasks = JSON.stringify(panelStory.tasks);
    const changed =
      next.story_points !== panelStory.story_points ||
      next.title !== panelStory.title ||
      next.epic_title !== panelStory.epic_title ||
      next.acceptance_criteria !== panelStory.acceptance_criteria ||
      next.description !== panelStory.description ||
      next.notes !== panelStory.notes ||
      next.assigned_to !== panelStory.assigned_to ||
      next.board_status !== panelStory.board_status ||
      next.priority_level !== panelStory.priority_level ||
      tasksJson !== prevTasks;
    if (changed) setPanelStory(next);
  }, [stories, panelStory, panelOpen]);

  function findColumnForStory(storyId: string): ColumnStatus | null {
    const s = stories.find((x) => x.id === storyId);
    if (!s) return null;
    return deriveStoryBoardColumn(s);
  }

  function handleDragStart(event: DragStartEvent) {
    const id = event.active.id as string;
    const found = stories.find((s) => s.id === id) ?? null;
    setActiveStory(found);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveStory(null);
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;
    const sourceCol = findColumnForStory(activeId);
    if (!sourceCol) return;

    const destCol: ColumnStatus = COLUMNS.includes(overId as ColumnStatus)
      ? (overId as ColumnStatus)
      : (findColumnForStory(overId) ?? sourceCol);

    if (sourceCol === destCol) return;

    const story = stories.find((s) => s.id === activeId);
    if (!story) return;

    setStories((prev) =>
      prev.map((s) =>
        s.id === activeId ? { ...s, board_status: destCol } : s
      )
    );

    if (pendingUpdate.current != null) window.clearTimeout(pendingUpdate.current);
    pendingUpdate.current = window.setTimeout(() => {
      void (async () => {
        const result = await patchStory(projectId, activeId, {
          board_status: destCol,
        });
        if (!result.ok) {
          console.error("Failed to update story board column:", result.message);
          void fetchData();
        }
      })();
    }, 400);
  }

  function handleCardClick(s: KanbanBoardStory) {
    setPanelStory(s);
    setPanelOpen(true);
  }

  function handleStoryUpdated(updated: KanbanBoardStory) {
    setStories((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    setPanelStory(updated);
  }

  const handlePersistStoryPatch = useCallback(
    async (
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
    ) => {
      const result = await patchStory(projectId, storyId, patch);
      if (!result.ok) return false;
      const { task_titles, ...storyFields } = patch;
      void task_titles;
      setStories((prev) =>
        prev.map((s) => (s.id === storyId ? { ...s, ...storyFields } : s))
      );
      setPanelStory((prev) =>
        prev?.id === storyId ? { ...prev, ...storyFields } : prev
      );
      if (patch.task_titles !== undefined) {
        void fetchData({ background: true });
      }
      return true;
    },
    [projectId, fetchData]
  );

  const totalStories = stories.length;

  if (loading) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--app-accent)]" aria-hidden />
        <span className="ml-3 text-sm text-zinc-500">Loading sprint board…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 py-24 text-center">
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

  if (totalStories === 0) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 py-24 text-center">
        <GitBranch className="h-8 w-8 text-zinc-600" aria-hidden />
        <p className="text-base font-medium text-zinc-400">No sprint stories yet</p>
        <p className="max-w-xs text-sm text-zinc-600">
          Add stories to the sprint from the Sprint or Backlog page — the same cards appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
          className="flex min-h-0 flex-1 gap-4 overflow-x-auto overflow-y-hidden pb-4 md:gap-6"
        >
          {COLUMNS.map((col) => (
            <div
              key={col}
              className="flex min-h-0 w-[320px] shrink-0 flex-col md:w-[400px] lg:min-w-0 lg:flex-1 lg:w-auto"
            >
              <KanbanColumn
                status={col}
                stories={storiesByStatus[col]}
                members={members}
                onCardClick={handleCardClick}
                onPersistStoryPatch={handlePersistStoryPatch}
              />
            </div>
          ))}
        </motion.div>

        <DragOverlay dropAnimation={{ duration: 180, easing: "ease" }}>
          {activeStory ? (
            <div className="rotate-1 scale-105 opacity-95 shadow-2xl">
              <KanbanCard
                story={activeStory}
                members={members}
                onOpen={() => {}}
                onPersistStoryPatch={async () => true}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <KanbanStoryPanel
        projectId={projectId}
        story={panelStory}
        members={members}
        open={panelOpen}
        onOpenChange={setPanelOpen}
        onStoryUpdated={handleStoryUpdated}
      />
    </div>
  );
}
