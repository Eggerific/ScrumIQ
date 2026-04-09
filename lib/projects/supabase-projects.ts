import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProjectRoleTag, ProjectSummary } from "@/components/projects/project-types";

/** Stored in `project_members.role` for the user who created the project. */
export const CREATOR_PROJECT_MEMBER_ROLE: ProjectRoleTag = "product_manager";

const DOT_CLASSES = [
  "bg-emerald-500",
  "bg-amber-500",
  "bg-blue-500",
  "bg-violet-500",
] as const;

export type ProjectMemberRow = { user_id: string; role: string };

export type ProjectRow = {
  id: string;
  project_name: string;
  description: string | null;
  owner_id: string;
  created_at?: string | null;
  updated_at?: string | null;
  project_members?: ProjectMemberRow[] | null;
};

function isProjectRoleTag(r: string): r is ProjectRoleTag {
  return (
    r === "product_manager" ||
    r === "scrum_master" ||
    r === "team_developer"
  );
}

function formatUpdatedLabel(iso: string | null | undefined): string | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return undefined;
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `Updated ${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `Updated ${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 14) return `Updated ${days}d ago`;
  return `Updated ${Math.floor(days / 7)}w ago`;
}

export function mapProjectRowsToSummaries(
  rows: ProjectRow[],
  currentUserId: string
): ProjectSummary[] {
  return rows.map((row, i) => {
    const myMember = row.project_members?.find(
      (m) => m.user_id === currentUserId
    );
    let roleTag: ProjectRoleTag | undefined;
    if (myMember?.role && isProjectRoleTag(myMember.role)) {
      roleTag = myMember.role;
    } else if (row.owner_id === currentUserId) {
      roleTag = "product_manager";
    }

    return {
      id: row.id,
      name: row.project_name,
      description: row.description ?? undefined,
      dotClass:
        DOT_CLASSES[i % DOT_CLASSES.length] ?? "bg-emerald-500",
      updatedLabel: formatUpdatedLabel(row.updated_at ?? row.created_at),
      roleTag,
      isCurrentUserOwner: row.owner_id === currentUserId,
      aiBriefEngagement: undefined,
    };
  });
}

/**
 * Loads projects visible under RLS (owner or member), with nested member rows
 * for role labels.
 */
export async function fetchWorkspaceProjects(
  supabase: SupabaseClient
): Promise<{ data: ProjectSummary[]; error: Error | null; userId: string | null }> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { data: [], error: null, userId: null };
  }

  const { data, error } = await supabase
    .from("projects")
    .select(
      `
      id,
      project_name,
      description,
      owner_id,
      created_at,
      updated_at,
      project_members ( user_id, role )
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    return {
      data: [],
      error: new Error(error.message),
      userId: user.id,
    };
  }

  const rows = (data ?? []) as ProjectRow[];
  return {
    data: mapProjectRowsToSummaries(rows, user.id),
    error: null,
    userId: user.id,
  };
}
