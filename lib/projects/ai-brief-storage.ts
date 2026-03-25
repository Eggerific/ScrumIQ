import type { AiBriefEngagement } from "@/components/projects/project-types";

const prefix = "scrumiq.aiBrief.";

export function aiBriefStorageKey(projectId: string): string {
  return `${prefix}${projectId}`;
}

/** Persisted per project in the browser so refresh + Supabase reload keep brief state. */
export function readAiBriefEngagement(
  projectId: string
): AiBriefEngagement | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(aiBriefStorageKey(projectId));
  if (
    raw === "complete" ||
    raw === "skipped" ||
    raw === "dismissed"
  ) {
    return raw;
  }
  return null;
}

export function writeAiBriefEngagement(
  projectId: string,
  value: AiBriefEngagement
): void {
  localStorage.setItem(aiBriefStorageKey(projectId), value);
}
