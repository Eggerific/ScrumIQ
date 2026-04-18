"use client";

import type { AiBacklogDraftPayload } from "@/lib/projects/ai-backlog-draft-types";

/** POST full backlog draft (same route as AI Generation “add to project”). */
export async function postProjectBacklogDraft(
  projectId: string,
  draft: AiBacklogDraftPayload
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const res = await fetch(`/api/projects/${projectId}/backlog`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ draft }),
    });
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      return {
        ok: false,
        message: body.error ?? `Request failed (${res.status})`,
      };
    }
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : "Network error",
    };
  }
}
