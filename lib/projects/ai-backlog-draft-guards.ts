import type { AiBacklogDraftPayload } from "@/lib/projects/ai-backlog-draft-types";

export function isAiBacklogDraftPayload(v: unknown): v is AiBacklogDraftPayload {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  if (typeof o.generatedAt !== "string") return false;
  if (o.artifactSource !== "stub" && o.artifactSource !== "live") return false;
  if (!Array.isArray(o.epics)) return false;
  for (const e of o.epics) {
    if (!e || typeof e !== "object") return false;
    const epic = e as Record<string, unknown>;
    if (typeof epic.id !== "string" || typeof epic.title !== "string") return false;
    if (typeof epic.description !== "string") return false;
    if (!Array.isArray(epic.stories)) return false;
    for (const s of epic.stories) {
      if (!s || typeof s !== "object") return false;
      const story = s as Record<string, unknown>;
      if (typeof story.id !== "string" || typeof story.title !== "string")
        return false;
      if (!Array.isArray(story.acceptanceCriteria)) return false;
      for (const line of story.acceptanceCriteria) {
        if (typeof line !== "string") return false;
      }
      if (!Array.isArray(story.tasks)) return false;
      for (const t of story.tasks) {
        if (!t || typeof t !== "object") return false;
        const task = t as Record<string, unknown>;
        if (typeof task.id !== "string" || typeof task.title !== "string")
          return false;
      }
    }
  }
  return true;
}

/**
 * Coerces a parsed model object into a valid draft when possible (missing ids,
 * loose types). Returns null if the structure cannot be salvaged.
 */
export function normalizeLooseBacklogDraft(
  raw: unknown,
  artifactSource: "live"
): AiBacklogDraftPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const epicsRaw = o.epics;
  if (!Array.isArray(epicsRaw) || epicsRaw.length === 0) return null;

  const epics: AiBacklogDraftPayload["epics"] = [];

  for (let ei = 0; ei < epicsRaw.length; ei++) {
    const e = epicsRaw[ei];
    if (!e || typeof e !== "object") return null;
    const er = e as Record<string, unknown>;
    const epicId =
      typeof er.id === "string" && er.id.trim()
        ? er.id.trim()
        : `epic-${ei}`;
    const title = String(er.title ?? "").trim() || `Epic ${ei + 1}`;
    const description = String(er.description ?? "").trim();
    const storiesRaw = er.stories;
    if (!Array.isArray(storiesRaw)) return null;

    const stories: AiBacklogDraftPayload["epics"][number]["stories"] = [];
    for (let si = 0; si < storiesRaw.length; si++) {
      const s = storiesRaw[si];
      if (!s || typeof s !== "object") return null;
      const sr = s as Record<string, unknown>;
      const storyId =
        typeof sr.id === "string" && sr.id.trim()
          ? sr.id.trim()
          : `story-${ei}-${si}`;
      const storyTitle =
        String(sr.title ?? "").trim() || `Story ${si + 1}`;

      let acceptanceCriteria: string[] = [];
      if (Array.isArray(sr.acceptanceCriteria)) {
        acceptanceCriteria = sr.acceptanceCriteria
          .map((x) => String(x ?? "").trim())
          .filter(Boolean);
      } else if (typeof sr.acceptanceCriteria === "string") {
        acceptanceCriteria = String(sr.acceptanceCriteria)
          .split(/\n+/)
          .map((x) => x.trim())
          .filter(Boolean);
      }

      const tasksRaw = sr.tasks;
      if (!Array.isArray(tasksRaw)) return null;
      const tasks: AiBacklogDraftPayload["epics"][number]["stories"][number]["tasks"] =
        [];
      for (let ti = 0; ti < tasksRaw.length; ti++) {
        const t = tasksRaw[ti];
        if (!t || typeof t !== "object") return null;
        const tr = t as Record<string, unknown>;
        const taskId =
          typeof tr.id === "string" && tr.id.trim()
            ? tr.id.trim()
            : `task-${ei}-${si}-${ti}`;
        const taskTitle = String(tr.title ?? "").trim();
        if (!taskTitle) continue;
        tasks.push({ id: taskId, title: taskTitle });
      }

      stories.push({
        id: storyId,
        title: storyTitle,
        acceptanceCriteria,
        tasks,
      });
    }

    if (stories.length === 0) return null;
    epics.push({ id: epicId, title, description, stories });
  }

  if (epics.length === 0) return null;

  const generatedAt =
    typeof o.generatedAt === "string" && o.generatedAt.trim()
      ? o.generatedAt.trim()
      : new Date().toISOString();

  return {
    generatedAt,
    artifactSource,
    epics,
  };
}

function extractFirstJsonObject(text: string): string | null {
  const trimmed = text.trim();
  const fence = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```$/im);
  const candidate = fence ? fence[1]!.trim() : trimmed;
  const start = candidate.indexOf("{");
  if (start < 0) return null;
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < candidate.length; i++) {
    const c = candidate[i]!;
    if (inStr) {
      if (esc) {
        esc = false;
      } else if (c === "\\") {
        esc = true;
      } else if (c === '"') {
        inStr = false;
      }
      continue;
    }
    if (c === '"') {
      inStr = true;
      continue;
    }
    if (c === "{") depth++;
    if (c === "}") {
      depth--;
      if (depth === 0) {
        return candidate.slice(start, i + 1);
      }
    }
  }
  return null;
}

export function parseBacklogDraftJsonFromModelText(
  text: string
): unknown | null {
  const slice = extractFirstJsonObject(text);
  if (!slice) return null;
  try {
    return JSON.parse(slice) as unknown;
  } catch {
    return null;
  }
}

export function coerceToAiBacklogDraftPayload(
  parsed: unknown
): AiBacklogDraftPayload | null {
  if (isAiBacklogDraftPayload(parsed)) {
    return {
      ...parsed,
      artifactSource: "live",
    };
  }
  return normalizeLooseBacklogDraft(parsed, "live");
}
