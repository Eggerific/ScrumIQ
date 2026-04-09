import type { SprintStoryRow } from "@/lib/projects/sprint-story-types";

/**
 * In-memory sprint story list per project so navigating Backlog → Sprint can
 * render immediately while a fresh fetch runs in the background.
 */
const store = new Map<string, SprintStoryRow[]>();

export function getSprintStoriesCache(projectId: string): SprintStoryRow[] | null {
  const rows = store.get(projectId);
  if (rows === undefined) return null;
  return structuredClone(rows);
}

export function setSprintStoriesCache(
  projectId: string,
  rows: SprintStoryRow[]
): void {
  store.set(projectId, structuredClone(rows));
}

export function clearSprintStoriesCache(projectId: string): void {
  store.delete(projectId);
}
