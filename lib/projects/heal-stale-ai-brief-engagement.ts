import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProjectSummary } from "@/components/projects/project-types";
import { mapAiBriefEngagement } from "@/lib/projects/supabase-projects";

/**
 * When `ai_brief_engagement` is still `pending` but epics/stories already exist in the DB
 * (e.g. backlog POST persisted rows but the projects-row update to `complete` failed),
 * align the column to `complete` so AI Generation and navigation stay consistent.
 */
export async function healStalePendingAiBriefEngagement(
  supabase: SupabaseClient,
  projectId: string,
  rawEngagement: string | null | undefined
): Promise<{
  engagement: ProjectSummary["aiBriefEngagement"];
  healed: boolean;
}> {
  const mapped = mapAiBriefEngagement(rawEngagement);
  if (mapped === "complete") {
    return { engagement: "complete", healed: false };
  }
  if (mapped !== "pending") {
    return { engagement: mapped, healed: false };
  }

  const { count, error: countErr } = await supabase
    .from("stories")
    .select("*", { count: "exact", head: true })
    .eq("project_id", projectId);

  if (countErr || count === null || count === 0) {
    return { engagement: "pending", healed: false };
  }

  const { error: upErr } = await supabase
    .from("projects")
    .update({ ai_brief_engagement: "complete" })
    .eq("id", projectId);

  if (upErr) {
    return { engagement: "pending", healed: false };
  }

  return { engagement: "complete", healed: true };
}
