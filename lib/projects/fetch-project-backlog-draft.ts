import type { SupabaseClient } from "@supabase/supabase-js";
import type { AiBacklogDraftPayload } from "@/lib/projects/ai-backlog-draft-types";

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
  acceptance_criteria: string | null;
};

type TaskRow = {
  id: string;
  story_id: string;
  title: string;
};

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
    .select("id, epic_id, title, acceptance_criteria")
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
        acceptanceCriteria: acFromPersistedText(s.acceptance_criteria ?? ""),
        tasks: (taskRows as TaskRow[])
          .filter((t) => t.story_id === s.id)
          .map((t) => ({ id: t.id, title: t.title })),
      })),
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    artifactSource: "live",
    epics,
  };
}
