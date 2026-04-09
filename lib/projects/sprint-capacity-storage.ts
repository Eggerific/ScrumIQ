const PREFIX = "scrumiq:sprint-capacity:";

/** Default team capacity in story points (editable in the sprint UI). */
export const DEFAULT_SPRINT_CAPACITY = 34;

export function readSprintCapacityPoints(projectId: string): number {
  if (typeof window === "undefined") return DEFAULT_SPRINT_CAPACITY;
  try {
    const raw = window.localStorage.getItem(`${PREFIX}${projectId}`);
    if (raw == null) return DEFAULT_SPRINT_CAPACITY;
    const n = Number.parseInt(raw, 10);
    if (!Number.isFinite(n) || n < 1 || n > 999) return DEFAULT_SPRINT_CAPACITY;
    return n;
  } catch {
    return DEFAULT_SPRINT_CAPACITY;
  }
}

export function writeSprintCapacityPoints(projectId: string, points: number): void {
  if (typeof window === "undefined") return;
  try {
    const n = Math.min(999, Math.max(1, Math.round(points)));
    window.localStorage.setItem(`${PREFIX}${projectId}`, String(n));
  } catch {
    /* ignore quota */
  }
}
