import type { SupabaseClient } from "@supabase/supabase-js";
import type { SprintStoryRow } from "@/lib/projects/sprint-story-types";

type StoryWithEpicJoin = {
  id: string;
  epic_id: string;
  title: string;
  story_points: number | null;
  in_sprint: boolean | null;
  priority: number | null;
  epics:
    | { title: string; priority: number | null }
    | { title: string; priority: number | null }[]
    | null;
};

function epicTitleFromJoin(epics: StoryWithEpicJoin["epics"]): string {
  if (!epics) return "Epic";
  if (Array.isArray(epics)) {
    const t = epics[0]?.title?.trim();
    return t || "Epic";
  }
  const t = epics.title?.trim();
  return t || "Epic";
}

function epicPriorityFromJoin(epics: StoryWithEpicJoin["epics"]): number {
  if (!epics) return 0;
  if (Array.isArray(epics)) return epics[0]?.priority ?? 0;
  return epics.priority ?? 0;
}

/**
 * Loads all stories for a project with epic titles for sprint backlog UI.
 */
export async function fetchProjectSprintStories(
  supabase: SupabaseClient,
  projectId: string
): Promise<SprintStoryRow[] | null> {
  const { data, error } = await supabase
    .from("stories")
    .select(
      "id, epic_id, title, story_points, in_sprint, priority, epics ( title, priority )"
    )
    .eq("project_id", projectId);

  if (error) {
    return null;
  }

  const rows = (data ?? []) as StoryWithEpicJoin[];
  const mapped = rows.map((r) => ({
    id: r.id,
    epic_id: r.epic_id,
    epic_title: epicTitleFromJoin(r.epics),
    title: r.title,
    story_points: r.story_points,
    in_sprint: Boolean(r.in_sprint),
    priority: r.priority ?? 0,
    _epOrder: epicPriorityFromJoin(r.epics),
  }));
  /** Match backlog view: epics by priority, then stories within each epic by priority. */
  mapped.sort((a, b) => {
    if (a._epOrder !== b._epOrder) return a._epOrder - b._epOrder;
    return a.priority - b.priority;
  });
  return mapped.map((row) => {
    const { _epOrder, ...rest } = row;
    void _epOrder;
    return rest;
  });
}
