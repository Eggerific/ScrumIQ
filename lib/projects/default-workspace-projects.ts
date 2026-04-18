import type { ProjectSummary } from "@/components/projects/project-types";

/**
 * Initial workspace projects (sidebar + 2×2 grid). Same ids as sidebar routes
 * `/projects/[id]`.
 */
export const DEFAULT_WORKSPACE_PROJECTS: ProjectSummary[] = [
  {
    id: "placeholder-acme-corp",
    name: "Acme Corp",
    description: "Customer portal refresh and API hardening.",
    dotClass: "bg-emerald-500",
    updatedLabel: "Updated 2d ago",
    roleTag: "product_manager",
    isCurrentUserOwner: true,
  },
  {
    id: "placeholder-beta-project",
    name: "Beta Project",
    description: "Mobile sprint goals and design QA.",
    dotClass: "bg-amber-500",
    updatedLabel: "Updated 1w ago",
    roleTag: "scrum_master",
    isCurrentUserOwner: true,
  },
  {
    id: "placeholder-gamma-team",
    name: "Gamma Team",
    description: "Internal tooling and onboarding flows.",
    dotClass: "bg-blue-500",
    updatedLabel: "Updated 3d ago",
    roleTag: "team_developer",
    isCurrentUserOwner: true,
  },
];
