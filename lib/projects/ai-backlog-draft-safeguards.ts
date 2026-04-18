import type { ProjectAiBriefInput } from "@/lib/projects/ai-brief-types";
import type { AiBacklogDraftPayload } from "@/lib/projects/ai-backlog-draft-types";
import { validateDraftAlignsWithBrief } from "@/lib/projects/ai-backlog-brief-alignment";

/**
 * Caps mirror persist-project-backlog limits in spirit, but tighter so the model
 * cannot return unusably huge strings before DB clip.
 */
export const LIVE_BACKLOG_LIMITS = {
  MAX_EPICS: 10,
  MAX_STORIES_PER_EPIC: 8,
  MAX_TASKS_PER_STORY: 12,
  MAX_ID_LEN: 128,
  MAX_EPIC_TITLE: 400,
  MAX_EPIC_DESC: 3000,
  MAX_STORY_TITLE: 400,
  MAX_AC_LINES: 16,
  MAX_AC_LINE_CHARS: 480,
  MAX_TASK_TITLE: 400,
  MIN_EPICS: 1,
  MIN_STORIES_PER_EPIC: 1,
  MIN_AC_PER_STORY: 2,
  MIN_TASKS_PER_STORY: 2,
} as const;

function clip(s: string, max: number): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function clipId(s: string, max: number, fallback: string): string {
  const t = s.trim();
  if (!t) return fallback;
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
}

/** Obvious placeholder / junk (reject and retry). */
function looksLikeJunkText(s: string): boolean {
  const lower = s.toLowerCase();
  if (/lorem ipsum|dolor sit amet/.test(lower)) return true;
  if (/\b(asdf|qwerty|aaaaaa|xxxxxx)\b/i.test(s)) return true;
  if (/^\s*(todo|fixme|tbd|xxx)\s*:?\s*$/i.test(s.trim())) return true;
  return false;
}

/**
 * Truncates counts and string lengths so payloads stay bounded and persist-safe.
 */
export function sanitizeLiveBacklogDraft(
  draft: AiBacklogDraftPayload
): AiBacklogDraftPayload {
  const L = LIVE_BACKLOG_LIMITS;
  const epics = draft.epics.slice(0, L.MAX_EPICS).map((epic, ei) => ({
    id: clipId(epic.id, L.MAX_ID_LEN, `epic-${ei}`),
    title: clip(epic.title, L.MAX_EPIC_TITLE) || `Epic ${ei + 1}`,
    description: clip(epic.description, L.MAX_EPIC_DESC),
    stories: epic.stories.slice(0, L.MAX_STORIES_PER_EPIC).map((story, si) => ({
      id: clipId(story.id, L.MAX_ID_LEN, `story-${ei}-${si}`),
      title: clip(story.title, L.MAX_STORY_TITLE) || `Story ${si + 1}`,
      storyPoints:
        typeof story.storyPoints === "number" &&
        Number.isInteger(story.storyPoints) &&
        story.storyPoints >= 1 &&
        story.storyPoints <= 99
          ? story.storyPoints
          : story.storyPoints === null
            ? null
            : undefined,
      acceptanceCriteria: story.acceptanceCriteria
        .slice(0, L.MAX_AC_LINES)
        .map((line) => clip(line, L.MAX_AC_LINE_CHARS))
        .filter(Boolean),
      tasks: story.tasks
        .slice(0, L.MAX_TASKS_PER_STORY)
        .map((task, ti) => ({
          id: clipId(task.id, L.MAX_ID_LEN, `task-${ei}-${si}-${ti}`),
          title: clip(task.title, L.MAX_TASK_TITLE),
        }))
        .filter((t) => t.title.trim().length > 0),
    })),
  }));

  return {
    generatedAt: draft.generatedAt,
    artifactSource: draft.artifactSource,
    epics,
  };
}

export function validateLiveBacklogDraftQuality(
  draft: AiBacklogDraftPayload
): { ok: true } | { ok: false; message: string } {
  const L = LIVE_BACKLOG_LIMITS;
  if (draft.epics.length < L.MIN_EPICS) {
    return { ok: false, message: "Generated backlog had no usable epics." };
  }

  for (const epic of draft.epics) {
    if (looksLikeJunkText(epic.title) || looksLikeJunkText(epic.description)) {
      return {
        ok: false,
        message:
          "Generated content looked like placeholder text. Try again or tighten your brief.",
      };
    }
    if (epic.stories.length < L.MIN_STORIES_PER_EPIC) {
      return {
        ok: false,
        message: "Each epic needs at least one story with real scope. Try again.",
      };
    }
    for (const story of epic.stories) {
      if (looksLikeJunkText(story.title)) {
        return {
          ok: false,
          message:
            "A story title looked like filler. Try again with a clearer brief.",
        };
      }
      if (story.acceptanceCriteria.length < L.MIN_AC_PER_STORY) {
        return {
          ok: false,
          message:
            "The model returned stories without enough acceptance criteria. Retry generation.",
        };
      }
      for (const line of story.acceptanceCriteria) {
        if (looksLikeJunkText(line)) {
          return {
            ok: false,
            message:
              "Acceptance criteria contained placeholder-like text. Try again.",
          };
        }
      }
      if (story.tasks.length < L.MIN_TASKS_PER_STORY) {
        return {
          ok: false,
          message:
            "Stories need more concrete tasks. Retry generation or shorten the brief.",
        };
      }
      for (const task of story.tasks) {
        if (looksLikeJunkText(task.title)) {
          return {
            ok: false,
            message: "A task looked like filler. Try again.",
          };
        }
      }
    }
  }

  return { ok: true };
}

export function enforceLiveBacklogDraftSafeguards(
  draft: AiBacklogDraftPayload,
  options?: { brief?: ProjectAiBriefInput }
):
  | { ok: true; draft: AiBacklogDraftPayload }
  | { ok: false; message: string } {
  const sanitized = sanitizeLiveBacklogDraft(draft);
  const q = validateLiveBacklogDraftQuality(sanitized);
  if (!q.ok) return q;
  if (options?.brief) {
    const a = validateDraftAlignsWithBrief(options.brief, sanitized);
    if (!a.ok) return a;
  }
  return { ok: true, draft: sanitized };
}
