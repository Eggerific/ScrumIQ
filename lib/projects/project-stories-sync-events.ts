/**
 * Fired when persisted backlog/stories for a project change after a successful
 * `POST /api/projects/:projectId/backlog`.
 *
 * Same event for **mock** (`SCRUMIQ_AI_MODE=mock`, client stub draft) and **live**
 * (server `generate-backlog` + model) — both flows save through the review panel
 * and hit the same persist route.
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
