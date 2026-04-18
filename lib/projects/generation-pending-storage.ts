const prefix = "scrumiq.generationPending.";

function key(projectId: string): string {
  return `${prefix}${projectId}`;
}

/**
 * Marks that a generation request is in flight (survives refresh until TTL).
 * Used to show a recovery hint if the user reloads before the client receives a draft.
 */
export function markGenerationPending(projectId: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      key(projectId),
      JSON.stringify({ startedAt: Date.now() })
    );
  } catch {
    /* quota / private mode */
  }
}

export function clearGenerationPending(projectId: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(key(projectId));
  } catch {
    /* ignore */
  }
}

/** Milliseconds when pending was set, or null if not pending. */
export function readGenerationPending(projectId: string): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(key(projectId));
    if (!raw) return null;
    const o = JSON.parse(raw) as { startedAt?: unknown };
    if (typeof o.startedAt !== "number" || !Number.isFinite(o.startedAt)) {
      return null;
    }
    return o.startedAt;
  } catch {
    return null;
  }
}
