import type { ProjectAiBriefInput } from "@/lib/projects/ai-brief-types";

/** Total characters across all brief fields (prompt injection / cost guard). */
export const MAX_BRIEF_TOTAL_CHARS_FOR_GENERATION = 20_000;

/** Per-field ceiling so a single textarea cannot dominate the prompt. */
export const MAX_BRIEF_FIELD_CHARS_FOR_GENERATION = 6_000;

export type BriefGenerationLimitResult =
  | { ok: true }
  | { ok: false; error: string };

export function validateBriefForBacklogGeneration(
  input: ProjectAiBriefInput
): BriefGenerationLimitResult {
  const entries = Object.entries(input) as [keyof ProjectAiBriefInput, string][];
  for (const [key, value] of entries) {
    if (value.length > MAX_BRIEF_FIELD_CHARS_FOR_GENERATION) {
      return {
        ok: false,
        error: `The field "${key}" is too long for generation (max ${MAX_BRIEF_FIELD_CHARS_FOR_GENERATION.toLocaleString()} characters). Shorten it and try again.`,
      };
    }
  }
  const total = entries.reduce((sum, [, v]) => sum + v.length, 0);
  if (total > MAX_BRIEF_TOTAL_CHARS_FOR_GENERATION) {
    return {
      ok: false,
      error: `Your brief is too long in total (max ${MAX_BRIEF_TOTAL_CHARS_FOR_GENERATION.toLocaleString()} characters across all fields). Trim content and try again.`,
    };
  }
  return { ok: true };
}
