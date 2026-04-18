import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AiBacklogDraftPayload } from "@/lib/projects/ai-backlog-draft-types";

const MAX_TITLE = 2000;
const MAX_DESC = 32000;
const MAX_AC = 32000;
const DEFAULT_TASK_STATUS = "To Do";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function idOrNew(id: string | undefined): string {
  if (id && UUID_RE.test(id)) return id;
  return randomUUID();
}

function clip(s: string, max: number): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function acToText(lines: string[]): string {
  return clip(lines.map((l) => l.trim()).filter(Boolean).join("\n\n"), MAX_AC);
}

export type PersistProjectBacklogResult =
  | { ok: true; epicCount: number; storyCount: number; taskCount: number }
  | { ok: false; message: string };

/**
 * Replaces all epics / stories / tasks for the project with rows derived from the draft.
 * Caller must enforce membership (e.g. API route after auth).
 */
export async function persistProjectBacklog(
  supabase: SupabaseClient,
  projectId: string,
  draft: AiBacklogDraftPayload
): Promise<PersistProjectBacklogResult> {
  if (!draft.epics || draft.epics.length === 0) {
    return { ok: false, message: "Draft has no epics to save." };
  }

  const { data: existingEpics } = await supabase
    .from("epics")
    .select("id, in_sprint")
    .eq("project_id", projectId);
  const epicSprintById = new Map<string, boolean>();
  for (const row of existingEpics ?? []) {
    if (row.id) epicSprintById.set(row.id, Boolean(row.in_sprint));
  }

  const { data: existingStories } = await supabase
    .from("stories")
    .select("id, in_sprint, story_points")
    .eq("project_id", projectId);
  type StoryPreserve = {
    in_sprint: boolean;
    story_points: number | null;
  };
  const storyPreserveById = new Map<string, StoryPreserve>();
  for (const row of existingStories ?? []) {
    if (!row.id) continue;
    storyPreserveById.set(row.id, {
      in_sprint: Boolean(row.in_sprint),
      story_points:
        typeof row.story_points === "number" ? row.story_points : null,
    });
  }

  const { error: delTasks } = await supabase
    .from("tasks")
    .delete()
    .eq("project_id", projectId);
  if (delTasks) {
    return { ok: false, message: delTasks.message };
  }

  const { error: delStories } = await supabase
    .from("stories")
    .delete()
    .eq("project_id", projectId);
  if (delStories) {
    return { ok: false, message: delStories.message };
  }

  const { error: delEpics } = await supabase
    .from("epics")
    .delete()
    .eq("project_id", projectId);
  if (delEpics) {
    return { ok: false, message: delEpics.message };
  }

  let storyCount = 0;
  let taskCount = 0;

  for (let ei = 0; ei < draft.epics.length; ei++) {
    const epic = draft.epics[ei]!;
    const epicId = idOrNew(epic.id);
    const { error: epicErr } = await supabase.from("epics").insert({
      id: epicId,
      project_id: projectId,
      title: clip(epic.title || "Untitled epic", MAX_TITLE),
      description: clip(epic.description ?? "", MAX_DESC),
      priority: ei,
      in_sprint: epicSprintById.get(epicId) ?? false,
    });
    if (epicErr) {
      return { ok: false, message: epicErr.message };
    }

    for (let si = 0; si < epic.stories.length; si++) {
      const story = epic.stories[si]!;
      const storyId = idOrNew(story.id);
      const prev = storyPreserveById.get(storyId);
      const validFib =
        typeof story.storyPoints === "number" &&
        Number.isInteger(story.storyPoints) &&
        story.storyPoints >= 1 &&
        story.storyPoints <= 99;
      let story_points: number | null;
      if (validFib) {
        story_points = story.storyPoints!;
      } else if (story.storyPoints === null) {
        story_points = null;
      } else {
        story_points = prev?.story_points ?? null;
      }
      const inSprintFromDraft =
        typeof story.inSprint === "boolean" ? story.inSprint : undefined;
      const in_sprint =
        inSprintFromDraft !== undefined
          ? inSprintFromDraft
          : (prev?.in_sprint ?? false);

      const { error: storyErr } = await supabase.from("stories").insert({
        id: storyId,
        epic_id: epicId,
        project_id: projectId,
        title: clip(story.title || "Untitled story", MAX_TITLE),
        description: "",
        acceptance_criteria: acToText(story.acceptanceCriteria ?? []),
        priority: si,
        in_sprint,
        story_points,
      });
      if (storyErr) {
        return { ok: false, message: storyErr.message };
      }
      storyCount += 1;

      for (let ti = 0; ti < story.tasks.length; ti++) {
        const task = story.tasks[ti]!;
        const title = task.title?.trim();
        if (!title) continue;
        const { error: taskErr } = await supabase.from("tasks").insert({
          id: idOrNew(task.id),
          story_id: storyId,
          project_id: projectId,
          title: clip(title, MAX_TITLE),
          description: null,
          priority: ti,
          status: DEFAULT_TASK_STATUS,
        });
        if (taskErr) {
          return { ok: false, message: taskErr.message };
        }
        taskCount += 1;
      }
    }
  }

  return {
    ok: true,
    epicCount: draft.epics.length,
    storyCount,
    taskCount,
  };
}
