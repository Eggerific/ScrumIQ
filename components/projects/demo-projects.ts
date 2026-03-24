import type { ProjectSummary } from "./project-types";
import { DEFAULT_WORKSPACE_PROJECTS } from "@/lib/projects/default-workspace-projects";

/** @deprecated Prefer DEFAULT_WORKSPACE_PROJECTS — same data. */
export const DEMO_PROJECTS: ProjectSummary[] = DEFAULT_WORKSPACE_PROJECTS;
