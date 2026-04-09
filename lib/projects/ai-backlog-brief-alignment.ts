import type { ProjectAiBriefInput } from "@/lib/projects/ai-brief-types";
import type { AiBacklogDraftPayload } from "@/lib/projects/ai-backlog-draft-types";

/** Common English glue words — stripped when scoring substance overlap. */
const STOPWORDS = new Set([
  "that",
  "this",
  "with",
  "from",
  "your",
  "their",
  "have",
  "has",
  "been",
  "were",
  "will",
  "would",
  "could",
  "should",
  "must",
  "into",
  "about",
  "such",
  "also",
  "only",
  "just",
  "each",
  "other",
  "than",
  "then",
  "them",
  "they",
  "what",
  "when",
  "where",
  "which",
  "while",
  "within",
  "without",
  "using",
  "used",
  "based",
  "being",
  "make",
  "made",
  "many",
  "more",
  "most",
  "much",
  "some",
  "very",
  "well",
  "work",
  "need",
  "goal",
  "goals",
  "time",
  "days",
  "day",
  "year",
  "team",
  "teams",
]);

function tokenize(s: string, minLen: number): string[] {
  const raw =
    s
      .toLowerCase()
      .match(/[a-z0-9]+/g)
      ?.filter((w) => w.length >= minLen && !STOPWORDS.has(w)) ?? [];
  return raw;
}

function draftHaystack(draft: AiBacklogDraftPayload): string {
  const parts: string[] = [];
  for (const epic of draft.epics) {
    parts.push(epic.title, epic.description);
    for (const story of epic.stories) {
      parts.push(story.title);
      parts.push(...story.acceptanceCriteria);
      for (const task of story.tasks) {
        parts.push(task.title);
      }
    }
  }
  return parts.join(" ").toLowerCase();
}

function titleReflectsBrief(title: string, hay: string): boolean {
  const t = title.toLowerCase().replace(/\s+/g, " ").trim();
  if (t.length < 2) return true;
  if (t.length >= 5) {
    const compactHay = hay.replace(/\s/g, "");
    const compactTitle = t.replace(/\s/g, "");
    if (compactHay.includes(compactTitle)) return true;
  }
  const words = t.match(/[a-z0-9]+/g)?.filter((w) => w.length >= 3) ?? [];
  if (words.length === 0) return true;
  const hits = words.filter((w) => hay.includes(w));
  return hits.length >= Math.max(1, Math.ceil(words.length * 0.5));
}

/**
 * Ensures the model didn’t return a generic backlog disconnected from the brief.
 * Used after structural quality checks; failures trigger an API retry.
 */
export function validateDraftAlignsWithBrief(
  brief: ProjectAiBriefInput,
  draft: AiBacklogDraftPayload
): { ok: true } | { ok: false; message: string } {
  const hay = draftHaystack(draft);

  if (draft.epics.length < 4) {
    return {
      ok: false,
      message:
        "Expected at least four epics that together cover the brief. Try again.",
    };
  }

  if (!titleReflectsBrief(brief.title, hay)) {
    return {
      ok: false,
      message:
        "The backlog didn’t reflect your project title closely enough. Try again.",
    };
  }

  const substance = [
    brief.vision,
    brief.targetUsers,
    brief.success90d,
    brief.constraints,
    brief.freeformNotes,
  ].join(" ");

  const substanceTokens = [...new Set(tokenize(substance, 4))].slice(0, 20);
  if (substanceTokens.length >= 3) {
    const required = Math.min(
      substanceTokens.length,
      Math.max(2, Math.ceil(substanceTokens.length * 0.28))
    );
    const hits = substanceTokens.filter((w) => hay.includes(w)).length;
    if (hits < required) {
      return {
        ok: false,
        message:
          "The backlog didn’t align tightly with your vision, users, success signals, or constraints. Try again.",
      };
    }
  }

  const storyTitles: string[] = [];
  for (const epic of draft.epics) {
    for (const story of epic.stories) {
      storyTitles.push(story.title.trim().toLowerCase());
    }
  }
  const byTitle = new Map<string, number>();
  for (const st of storyTitles) {
    byTitle.set(st, (byTitle.get(st) ?? 0) + 1);
  }
  let duplicateTitles = 0;
  for (const c of byTitle.values()) {
    if (c > 1) duplicateTitles += c - 1;
  }
  if (duplicateTitles > 2) {
    return {
      ok: false,
      message:
        "Too many repeated story titles across epics. Try again for clearer structure.",
    };
  }

  return { ok: true };
}
