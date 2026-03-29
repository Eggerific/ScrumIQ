import type {
  ProjectAiBriefInput,
  ProjectAiBriefResponse,
} from "./ai-brief-types";

export class AiBriefClientError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = "AiBriefClientError";
  }
}

/**
 * Calls the existing App Router API. Server validation and mock/live behavior
 * are owned by the API route — this module only performs fetch + JSON parse.
 */
export async function postProjectAiBrief(
  input: ProjectAiBriefInput
): Promise<ProjectAiBriefResponse> {
  const res = await fetch("/api/projects/ai-brief", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  let body: unknown;
  try {
    body = await res.json();
  } catch {
    throw new AiBriefClientError("Invalid response from server", res.status);
  }

  if (!res.ok) {
    const msg =
      typeof body === "object" &&
      body !== null &&
      "error" in body &&
      typeof (body as { error: unknown }).error === "string"
        ? (body as { error: string }).error
        : `Request failed (${res.status})`;
    throw new AiBriefClientError(msg, res.status);
  }

  const o = body as Record<string, unknown>;
  if (
    typeof o.narrative !== "string" ||
    typeof o.structured !== "object" ||
    o.structured === null
  ) {
    throw new AiBriefClientError("Brief response was incomplete", res.status);
  }

  return body as ProjectAiBriefResponse;
}
