import type { ProjectAiBriefInput } from "@/lib/projects/ai-brief-types";
import type { AiBacklogDraftPayload } from "@/lib/projects/ai-backlog-draft-types";

export class GenerateBacklogClientError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = "GenerateBacklogClientError";
  }
}

/**
 * Live-mode backlog generation: server validates brief, auth, and membership.
 */
export async function postProjectGenerateBacklog(
  projectId: string,
  input: ProjectAiBriefInput,
  init?: RequestInit
): Promise<AiBacklogDraftPayload> {
  const res = await fetch(`/api/projects/${projectId}/generate-backlog`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    ...init,
  });

  let body: unknown;
  try {
    body = await res.json();
  } catch {
    throw new GenerateBacklogClientError(
      "Invalid response from server",
      res.status
    );
  }

  if (!res.ok) {
    const msg =
      typeof body === "object" &&
      body !== null &&
      "error" in body &&
      typeof (body as { error: unknown }).error === "string"
        ? (body as { error: string }).error
        : `Request failed (${res.status})`;
    throw new GenerateBacklogClientError(msg, res.status);
  }

  const o = body as Record<string, unknown>;
  if (!o.draft || typeof o.draft !== "object") {
    throw new GenerateBacklogClientError(
      "Response missing backlog draft",
      res.status
    );
  }

  return o.draft as AiBacklogDraftPayload;
}
