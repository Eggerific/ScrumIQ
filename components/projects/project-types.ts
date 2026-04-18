export type ProjectRoleTag =
  | "product_manager"
  | "scrum_master"
  | "team_developer";

export const PROJECT_ROLE_LABELS: Record<ProjectRoleTag, string> = {
  product_manager: "Product Manager",
  scrum_master: "Scrum Master",
  team_developer: "Team Developer",
};

/** PM and SM may add people to the project (matches typical Scrum access). */
export function canInviteProjectMembers(
  roleTag: ProjectRoleTag | undefined
): boolean {
  return roleTag === "product_manager" || roleTag === "scrum_master";
}

/**
 * `pending` — new project: auto-open brief once until user acts.
 * `dismissed` — skipped onboarding; can open AI Generation from the sidebar.
 * `complete` — AI backlog was saved to the project; brief flow redirects to Backlog (persisted in DB + localStorage).
 * `skipped` — legacy; treated like dismissed for navigation.
 */
export type AiBriefEngagement =
  | "pending"
  | "dismissed"
  | "complete"
  | "skipped";

export interface ProjectSummary {
  id: string;
  name: string;
  description?: string;
  /** Tailwind dot color class, e.g. bg-emerald-500 */
  dotClass: string;
  updatedLabel?: string;
  /** Your role / hat on this project (shown on the card). */
  roleTag?: ProjectRoleTag;
  /** True when the signed-in user created the project (`projects.owner_id`). */
  isCurrentUserOwner: boolean;
  aiBriefEngagement?: AiBriefEngagement;
}
