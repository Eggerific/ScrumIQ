import {
  tasksPlainTextForEditor,
  type KanbanBoardStory,
} from "@/lib/projects/kanban-workflow";

/** One UI row per task line (matches backlog: one field per task). */
export function taskLinesDraftFromStory(story: KanbanBoardStory): string[] {
  const raw = tasksPlainTextForEditor(story);
  if (!raw.trim()) return [""];
  return raw.split("\n");
}

/** One UI row per acceptance criterion (split like backlog `acToText` inverse). */
export function acLinesDraftFromStory(acceptance_criteria: string): string[] {
  const ac = acceptance_criteria ?? "";
  const parts = ac
    .split(/\n\n+/)
    .map((x) => x.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : [""];
}

/** Persist AC lines the same way as `persistProjectBacklog` / backlog draft. */
export function persistAcLines(lines: string[]): string {
  return lines.map((l) => l.trim()).filter(Boolean).join("\n\n");
}

/** Non-empty task titles for API `task_titles` (each becomes a task row). */
export function persistTaskTitles(lines: string[]): string[] {
  return lines.map((l) => l.trim()).filter(Boolean);
}

/** Stable compare for dirty checks. */
export function fingerprintLines(lines: string[]): string {
  return JSON.stringify(lines.map((l) => l.trim()));
}

/** Lines to show on the Kanban card (non-empty only). */
export function taskDisplayLines(story: KanbanBoardStory): string[] {
  return persistTaskTitles(taskLinesDraftFromStory(story));
}

export function acDisplayLines(acceptance_criteria: string): string[] {
  const parts = acLinesDraftFromStory(acceptance_criteria).map((l) => l.trim()).filter(Boolean);
  return parts;
}
