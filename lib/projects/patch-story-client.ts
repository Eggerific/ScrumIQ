"use client";

import { clearBacklogDraft } from "@/lib/projects/backlog-draft-storage";
import { dispatchProjectStoriesChanged } from "@/lib/projects/project-stories-sync-events";
import type { KanbanWorkflowColumn } from "@/lib/projects/kanban-workflow";

/**
 * PATCH `/api/projects/:projectId/stories/:storyId` — sprint membership & points.
 */
export async function patchStory(
  projectId: string,
  storyId: string,
  body: {
    in_sprint?: boolean;
    story_points?: number | null;
    description?: string;
    acceptance_criteria?: string;
    notes?: string;
    /** Replaces task rows; clears story `description` on the server. */
    task_titles?: string[];
    assigned_to?: string | null;
    board_status?: KanbanWorkflowColumn;
    /** Kanban severity: 0 Low, 1 Medium, 2 High, 3 Critical. */
    priority_level?: 0 | 1 | 2 | 3;
  }
): Promise<{ ok: true } | { ok: false; message: string }> {
  const res = await fetch(`/api/projects/${projectId}/stories/${storyId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  const json = (await res.json().catch(() => ({}))) as {
    error?: string;
  };
  if (!res.ok) {
    return { ok: false, message: json.error ?? res.statusText };
  }
  if (
    body.task_titles !== undefined ||
    body.acceptance_criteria !== undefined
  ) {
    clearBacklogDraft(projectId);
  }
  dispatchProjectStoriesChanged(projectId);
  return { ok: true };
}
