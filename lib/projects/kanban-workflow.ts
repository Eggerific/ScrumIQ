import type { StoryPriorityLevel } from "@/lib/projects/story-priority-level";
import { coerceStoryPriorityLevel } from "@/lib/projects/story-priority-level";

/** Kanban columns — stored on `stories.board_status` (not on tasks). */
export type KanbanWorkflowColumn = "To Do" | "In Progress" | "Done";

export type { StoryPriorityLevel };

export type KanbanTaskStub = {
  id: string;
  title: string;
  priority: number | null;
};

/** One card on the board = one in-sprint story (same grain as the Sprint page). */
export type KanbanBoardStory = {
  id: string;
  epic_id: string;
  epic_title: string;
  title: string;
  story_points: number | null;
  /** Backlog / epic ordering index (`stories.priority`). */
  priority: number;
  /** Kanban severity 0–3 (`stories.priority_level`). */
  priority_level: StoryPriorityLevel;
  /** Kanban swimlane (`stories.board_status`). */
  board_status: KanbanWorkflowColumn;
  /** Whole-story assignee (`stories.assigned_to`). */
  assigned_to: string | null;
  /** Joined acceptance lines (same storage as backlog / `persistProjectBacklog`). */
  acceptance_criteria: string;
  /** Freeform task notes for Kanban (same `stories.description` column). */
  description: string;
  /** Freeform notes / long description (`stories.notes`), separate from tasks. */
  notes: string;
  tasks: KanbanTaskStub[];
};

function sortTasksByPriority(tasks: KanbanTaskStub[]): KanbanTaskStub[] {
  return [...tasks].sort((a, b) => {
    const pa = typeof a.priority === "number" ? a.priority : 0;
    const pb = typeof b.priority === "number" ? b.priority : 0;
    return pa - pb;
  });
}

/**
 * Editor value for “Tasks”: prefer structured `tasks` rows (source of truth after
 * Kanban/backlog saves). Use legacy `stories.description` only when there are no rows.
 */
export function tasksPlainTextForEditor(story: {
  description: string;
  tasks: KanbanTaskStub[];
}): string {
  const list = story.tasks ?? [];
  if (list.length > 0) {
    return sortTasksByPriority(list)
      .map((t) => (t.title ?? "").trim())
      .join("\n");
  }
  const d = story.description ?? "";
  return d.trim().length > 0 ? d : "";
}

type EpicJoin =
  | { title: string; priority: number | null }
  | { title: string; priority: number | null }[]
  | null;

function epicTitleFromJoin(epics: EpicJoin): string {
  if (!epics) return "Epic";
  if (Array.isArray(epics)) {
    const t = epics[0]?.title?.trim();
    return t || "Epic";
  }
  const t = epics.title?.trim();
  return t || "Epic";
}

function epicPriorityFromJoin(epics: EpicJoin): number {
  if (!epics) return 0;
  if (Array.isArray(epics)) return epics[0]?.priority ?? 0;
  return epics.priority ?? 0;
}

type RawTaskRow = {
  id: string;
  title?: string | null;
  priority?: number | null;
};

type RawStoryRow = {
  id: string;
  epic_id: string;
  title: string;
  story_points: number | null;
  priority: number | null;
  priority_level?: number | null;
  board_status?: string | null;
  assigned_to: string | null;
  description: string | null;
  acceptance_criteria: string | null;
  notes?: string | null;
  epics: EpicJoin;
  tasks: RawTaskRow[] | null;
};

const BOARD_COLUMNS: KanbanWorkflowColumn[] = ["To Do", "In Progress", "Done"];

function coerceBoardStatus(value: string | null | undefined): KanbanWorkflowColumn {
  const v = (value ?? "").trim();
  return BOARD_COLUMNS.includes(v as KanbanWorkflowColumn)
    ? (v as KanbanWorkflowColumn)
    : "To Do";
}

/**
 * Maps Supabase `stories` rows (with `epics` + `tasks` joins) and sorts like the Sprint backlog:
 * epic priority, then story priority.
 */
export function mapAndSortKanbanStoriesFromQuery(
  rows: unknown[]
): KanbanBoardStory[] {
  const mapped = (rows as RawStoryRow[]).map((r) => {
    const taskList = sortTasksByPriority(
      (r.tasks ?? []).map((t) => ({
        id: t.id,
        title: (t.title ?? "").trim() || "Untitled task",
        priority: typeof t.priority === "number" ? t.priority : null,
      }))
    );
    return {
      id: r.id,
      epic_id: r.epic_id,
      epic_title: epicTitleFromJoin(r.epics),
      title: (r.title ?? "").trim() || "Untitled story",
      story_points: r.story_points,
      priority: r.priority ?? 0,
      priority_level: coerceStoryPriorityLevel(r.priority_level),
      board_status: coerceBoardStatus(r.board_status),
      assigned_to:
        typeof r.assigned_to === "string" && r.assigned_to.length > 0
          ? r.assigned_to
          : null,
      acceptance_criteria: r.acceptance_criteria ?? "",
      description: r.description ?? "",
      notes: r.notes ?? "",
      tasks: taskList,
      _epOrder: epicPriorityFromJoin(r.epics),
    };
  });
  mapped.sort((a, b) => {
    if (a._epOrder !== b._epOrder) return a._epOrder - b._epOrder;
    return a.priority - b.priority;
  });
  return mapped.map(({ _epOrder: _, ...rest }) => rest);
}

/** Kanban column for a story (`stories.board_status`). */
export function deriveStoryBoardColumn(story: KanbanBoardStory): KanbanWorkflowColumn {
  return coerceBoardStatus(story.board_status);
}
