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
 * `pending` — first open shows the brief explainer (planned fields; no generation yet).
 * `complete` — explainer dismissed. `skipped` — legacy; can reopen explainer from the page.
 * Omitted on seeds = no auto dialog.
 */
export type AiBriefEngagement = "pending" | "complete" | "skipped";

export interface ProjectSummary {
  id: string;
  name: string;
  description?: string;
  /** Tailwind dot color class, e.g. bg-emerald-500 */
  dotClass: string;
  updatedLabel?: string;
  /** Your role / hat on this project (shown on the card). */
  roleTag?: ProjectRoleTag;
  aiBriefEngagement?: AiBriefEngagement;
}
