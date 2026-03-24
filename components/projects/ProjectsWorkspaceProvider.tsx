"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { MAX_PROJECTS_ON_WORKSPACE_LIST } from "@/lib/projects/constants";
import { DEFAULT_WORKSPACE_PROJECTS } from "@/lib/projects/default-workspace-projects";
import { CreateProjectModal } from "./CreateProjectModal";
import { RemoveProjectConfirmModal } from "./RemoveProjectConfirmModal";
import type { ProjectSummary } from "./project-types";

type ProjectsWorkspaceContextValue = {
  projects: ProjectSummary[];
  openCreateProjectModal: () => void;
  atProjectLimit: boolean;
  /** Set briefly after a project is created — grid can run a one-shot celebration. */
  celebrateProjectId: string | null;
  /** Opens in-app confirm dialog, then removes if the user confirms. */
  requestRemoveProject: (project: ProjectSummary) => void;
  /** Removes a project from the workspace list (local state until persistence exists). */
  removeProject: (id: string) => void;
  /** Merge fields into an existing project (e.g. after AI brief). */
  updateProject: (id: string, patch: Partial<ProjectSummary>) => void;
};

const ProjectsWorkspaceContext =
  createContext<ProjectsWorkspaceContextValue | null>(null);

export function useProjectsWorkspace(): ProjectsWorkspaceContextValue {
  const ctx = useContext(ProjectsWorkspaceContext);
  if (!ctx) {
    throw new Error(
      "useProjectsWorkspace must be used within ProjectsWorkspaceProvider"
    );
  }
  return ctx;
}

/** Safe for optional use (e.g. tests); returns null outside provider. */
export function useProjectsWorkspaceOptional(): ProjectsWorkspaceContextValue | null {
  return useContext(ProjectsWorkspaceContext);
}

const CELEBRATION_MS = 1400;

export function ProjectsWorkspaceProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<ProjectSummary[]>(
    DEFAULT_WORKSPACE_PROJECTS
  );
  const [createOpen, setCreateOpen] = useState(false);
  const [celebrateProjectId, setCelebrateProjectId] = useState<string | null>(
    null
  );
  const [removeTarget, setRemoveTarget] = useState<ProjectSummary | null>(null);

  useEffect(() => {
    if (!celebrateProjectId) return;
    const t = window.setTimeout(() => setCelebrateProjectId(null), CELEBRATION_MS);
    return () => window.clearTimeout(t);
  }, [celebrateProjectId]);

  const addProject = useCallback((p: ProjectSummary) => {
    setProjects((prev) => [p, ...prev].slice(0, MAX_PROJECTS_ON_WORKSPACE_LIST));
    setCelebrateProjectId(p.id);
  }, []);

  const removeProject = useCallback((id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const requestRemoveProject = useCallback((project: ProjectSummary) => {
    setRemoveTarget(project);
  }, []);

  const handleConfirmRemoveProject = useCallback(() => {
    setRemoveTarget((current) => {
      if (current) removeProject(current.id);
      return null;
    });
  }, [removeProject]);

  const updateProject = useCallback(
    (id: string, patch: Partial<ProjectSummary>) => {
      setProjects((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...patch } : p))
      );
    },
    []
  );

  const atLimit = projects.length >= MAX_PROJECTS_ON_WORKSPACE_LIST;

  const value = useMemo(
    () => ({
      projects,
      openCreateProjectModal: () => setCreateOpen(true),
      atProjectLimit: atLimit,
      celebrateProjectId,
      requestRemoveProject,
      removeProject,
      updateProject,
    }),
    [
      projects,
      atLimit,
      celebrateProjectId,
      requestRemoveProject,
      removeProject,
      updateProject,
    ]
  );

  return (
    <ProjectsWorkspaceContext.Provider value={value}>
      {children}
      <CreateProjectModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        existingProjectCount={projects.length}
        projectLimitReached={atLimit}
        onProjectCreated={addProject}
      />
      <RemoveProjectConfirmModal
        project={removeTarget}
        onCancel={() => setRemoveTarget(null)}
        onConfirm={handleConfirmRemoveProject}
      />
    </ProjectsWorkspaceContext.Provider>
  );
}
