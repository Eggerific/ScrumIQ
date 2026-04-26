/** Kanban story severity — stored on `stories.priority_level` (not list order `priority`). */

export const STORY_PRIORITY_LEVELS = [0, 1, 2, 3] as const;
export type StoryPriorityLevel = (typeof STORY_PRIORITY_LEVELS)[number];

export const STORY_PRIORITY_DISPLAY: Record<
  StoryPriorityLevel,
  { label: string; dotClass: string }
> = {
  0: { label: "Low", dotClass: "bg-zinc-600" },
  1: { label: "Medium", dotClass: "bg-sky-500" },
  2: { label: "High", dotClass: "bg-amber-400" },
  3: { label: "Critical", dotClass: "bg-red-500" },
};

export function coerceStoryPriorityLevel(
  value: number | null | undefined
): StoryPriorityLevel {
  const n = typeof value === "number" && Number.isInteger(value) ? value : 0;
  if (n === 1 || n === 2 || n === 3) return n;
  return 0;
}
