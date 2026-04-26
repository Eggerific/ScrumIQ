import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AiBacklogDraftPayload,
  AiGeneratedTask,
} from "@/lib/projects/ai-backlog-draft-types";

function acFromPersistedText(text: string): string[] {
  const t = text.trim();
  if (!t) return [];
  return t.split(/\n\n+/).map((x) => x.trim()).filter(Boolean);
}

type EpicRow = {
  id: string;
  title: string;
  description: string | null;
};

type StoryRow = {
  id: string;
  epic_id: string;
  title: string;
  /** Legacy tasks blob when no `tasks` rows; new saves use `tasks` only and keep this empty. */
  description: string | null;
  acceptance_criteria: string | null;
  story_points: number | null;
  in_sprint: boolean | null;
};

type TaskRow = {
  id: string;
  story_id: string;
  title: string;
};

function newTaskId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `task-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Tasks in the backlog UI: one draft row per `tasks` row when present; otherwise
 * split legacy `stories.description` on newlines into separate tasks.
 */
function tasksDraftForStory(
  story: StoryRow,
  taskRows: TaskRow[]
): AiGeneratedTask[] {
  const forStory = taskRows.filter((t) => t.story_id === story.id);
  if (forStory.length > 0) {
    return forStory.map((t) => ({
      id: t.id,
      title: (t.title ?? "").trim() || "",
    }));
  }
  const rawDesc = story.description ?? "";
  if (rawDesc.trim().length > 0) {
    const lines = rawDesc
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) {
      return [{ id: newTaskId(), title: "" }];
    }
    return lines.map((title) => ({ id: newTaskId(), title }));
  }
  return [{ id: newTaskId(), title: "" }];
}

/**
 * Builds a backlog draft from persisted epics/stories/tasks so members without
 * a session draft (e.g. invited teammates) can view the shared backlog.
 */
export async function fetchProjectBacklogDraftFromDb(
  supabase: SupabaseClient,
  projectId: string
): Promise<AiBacklogDraftPayload | null> {
  const { data: epicRows, error: epicErr } = await supabase
    .from("epics")
    .select("id, title, description")
    .eq("project_id", projectId)
    .order("priority", { ascending: true });

  if (epicErr || !epicRows?.length) return null;

  const { data: storyRows, error: storyErr } = await supabase
    .from("stories")
    .select(
      "id, epic_id, title, description, acceptance_criteria, story_points, in_sprint"
    )
    .eq("project_id", projectId)
    .order("priority", { ascending: true });

  if (storyErr || !storyRows) return null;

  const { data: taskRows, error: taskErr } = await supabase
    .from("tasks")
    .select("id, story_id, title")
    .eq("project_id", projectId)
    .order("priority", { ascending: true });

  if (taskErr || !taskRows) return null;

  const epics = (epicRows as EpicRow[]).map((epic) => {
    const storiesForEpic = (storyRows as StoryRow[]).filter(
      (s) => s.epic_id === epic.id
    );
    return {
      id: epic.id,
      title: epic.title,
      description: epic.description ?? "",
      stories: storiesForEpic.map((s) => ({
        id: s.id,
        title: s.title,
        storyPoints: s.story_points,
        inSprint: Boolean(s.in_sprint),
        acceptanceCriteria: acFromPersistedText(s.acceptance_criteria ?? ""),
        tasks: tasksDraftForStory(s, taskRows as TaskRow[]),
      })),
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    artifactSource: "live",
    epics,
  };
}
