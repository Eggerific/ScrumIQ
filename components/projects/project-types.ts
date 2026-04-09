export type ProjectRoleTag =
  | "product_manager"
  | "scrum_master"
  | "team_developer";

export const PROJECT_ROLE_LABELS: Record<ProjectRoleTag, string> = {
  product_manager: "Product Manager",
  scrum_master: "Scrum Master",
  team_developer: "Team Developer",
};

/**
 * `pending` — new project: auto-open brief once until user acts.
 * `dismissed` — closed with X/backdrop; can reopen from the page (not stuck).
 * `complete` — finished via “Continue to project”; can still reopen preview.
 * `skipped` — legacy; can reopen explainer from the page.
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
