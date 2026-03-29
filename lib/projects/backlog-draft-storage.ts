import type { AiBacklogDraftPayload } from "./ai-backlog-draft-types";

const prefix = "scrumiq.backlogDraft.";

export function backlogDraftStorageKey(projectId: string): string {
  return `${prefix}${projectId}`;
}

export function readBacklogDraft(
  projectId: string
): AiBacklogDraftPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(backlogDraftStorageKey(projectId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AiBacklogDraftPayload;
    if (!parsed || !Array.isArray(parsed.epics)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeBacklogDraft(
  projectId: string,
  payload: AiBacklogDraftPayload
): void {
  sessionStorage.setItem(
    backlogDraftStorageKey(projectId),
    JSON.stringify(payload)
  );
}

export function clearBacklogDraft(projectId: string): void {
  sessionStorage.removeItem(backlogDraftStorageKey(projectId));
}
