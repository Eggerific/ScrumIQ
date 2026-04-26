/**
 * Fired when persisted backlog/stories for a project change in ways that should
 * refresh Sprint and Kanban views for that project:
 *
 * - Successful `POST /api/projects/:projectId/backlog` (mock or live draft).
 * - Successful `PATCH /api/projects/:projectId/stories/:storyId` (sprint membership,
 *   story points) from the Sprint or Backlog UI.
 */
export const PROJECT_STORIES_CHANGED_EVENT = "scrumiq:project-stories-changed";

export type ProjectStoriesChangedDetail = { projectId: string };

export function dispatchProjectStoriesChanged(projectId: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<ProjectStoriesChangedDetail>(PROJECT_STORIES_CHANGED_EVENT, {
      detail: { projectId },
    })
  );
}

/** Call when `POST /api/projects/:projectId/backlog` succeeded (mock or live draft). */
export function notifyProjectBacklogSavedToDatabase(projectId: string): void {
  dispatchProjectStoriesChanged(projectId);
}

export function subscribeProjectStoriesChanged(
  projectId: string,
  onChange: () => void
): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = (e: Event) => {
    const ce = e as CustomEvent<ProjectStoriesChangedDetail>;
    if (ce.detail?.projectId === projectId) onChange();
  };
  window.addEventListener(PROJECT_STORIES_CHANGED_EVENT, handler);
  return () =>
    window.removeEventListener(PROJECT_STORIES_CHANGED_EVENT, handler);
}
