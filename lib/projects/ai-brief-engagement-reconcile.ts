import type { AiBriefEngagement } from "@/components/projects/project-types";
import { readBacklogDraft } from "@/lib/projects/backlog-draft-storage";
import { writeAiBriefEngagement } from "@/lib/projects/ai-brief-storage";

/**
 * Engagement can be `complete` in localStorage while the backlog draft only lives in
 * sessionStorage (cleared on new session/tab). Treat that as stale: allow AI Generation
 * again and align storage with `dismissed`.
 */
export function reconcileStaleCompleteEngagement(
  projectId: string,
  engagement: AiBriefEngagement | null | undefined
): { next: AiBriefEngagement | null | undefined; changed: boolean } {
  if (engagement !== "complete") {
    return { next: engagement, changed: false };
  }
  if (typeof window === "undefined") {
    return { next: engagement, changed: false };
  }
  if (readBacklogDraft(projectId)) {
    return { next: engagement, changed: false };
  }
  writeAiBriefEngagement(projectId, "dismissed");
  return { next: "dismissed", changed: true };
}
