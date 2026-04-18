"use client";

/**
 * PATCH `/api/projects/:projectId/stories/:storyId` — sprint membership & points.
 */
export async function patchStory(
  projectId: string,
  storyId: string,
  body: { in_sprint?: boolean; story_points?: number | null }
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
  return { ok: true };
}
