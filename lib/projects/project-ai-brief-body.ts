import type { ProjectAiBriefInput } from "@/lib/projects/ai-brief-types";

export type ParseProjectAiBriefBodyResult =
  | { ok: true; input: ProjectAiBriefInput }
  | { ok: false; status: number; error: string };

function isBriefShape(body: unknown): body is Record<string, string> {
  if (!body || typeof body !== "object") return false;
  const o = body as Record<string, unknown>;
  const str = (k: string) => typeof o[k] === "string";
  return (
    str("title") &&
    str("vision") &&
    str("targetUsers") &&
    str("success90d") &&
    str("constraints") &&
    str("freeformNotes")
  );
}

/**
 * Shared POST body parsing for brief-shaped JSON (generate-backlog, ai-brief).
 */
export function parseProjectAiBriefBody(
  json: unknown
): ParseProjectAiBriefBodyResult {
  if (!isBriefShape(json)) {
    return {
      ok: false,
      status: 400,
      error: "Missing or invalid brief fields",
    };
  }

  const input: ProjectAiBriefInput = {
    title: json.title.trim(),
    vision: json.vision.trim(),
    targetUsers: json.targetUsers.trim(),
    success90d: json.success90d.trim(),
    constraints: json.constraints.trim(),
    freeformNotes: json.freeformNotes.trim(),
  };

  if (input.title.length < 2) {
    return {
      ok: false,
      status: 400,
      error: "Title should be at least 2 characters",
    };
  }
  if (input.vision.length < 8) {
    return {
      ok: false,
      status: 400,
      error: "Vision / problem needs a bit more detail (8+ characters)",
    };
  }

  return { ok: true, input };
}
