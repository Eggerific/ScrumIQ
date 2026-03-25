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
import { createClient } from "@/lib/supabase/client";
import { MAX_PROJECTS_ON_WORKSPACE_LIST } from "@/lib/projects/constants";
import {
  CREATOR_PROJECT_MEMBER_ROLE,
  fetchWorkspaceProjects,
} from "@/lib/projects/supabase-projects";
import { CreateProjectModal } from "./CreateProjectModal";
import { RemoveProjectConfirmModal } from "./RemoveProjectConfirmModal";
import type { ProjectSummary } from "./project-types";

type ProjectsWorkspaceContextValue = {
  projects: ProjectSummary[];
  /** True until the first Supabase projects fetch finishes (success or error). */
  projectsHydrated: boolean;
  /** True only during the initial load. */
  projectsLoading: boolean;
  /** Set when the initial project list fetch fails. */
  projectsLoadError: string | null;
  openCreateProjectModal: () => void;
  atProjectLimit: boolean;
  /** Set briefly after a project is created — grid can run a one-shot celebration. */
  celebrateProjectId: string | null;
  /** Opens in-app confirm dialog, then removes if the user confirms. */
  requestRemoveProject: (project: ProjectSummary) => void;
  /** Removes a project from the workspace list and Supabase. */
  removeProject: (id: string) => void;
  /** Merge fields into an existing project (e.g. after AI brief). */
  updateProject: (id: string, patch: Partial<ProjectSummary>) => void;
  /** Re-fetch projects from Supabase (e.g. after external changes). */
  refreshProjects: (opts?: { showLoading?: boolean }) => Promise<void>;
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
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [projectsHydrated, setProjectsHydrated] = useState(false);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectsLoadError, setProjectsLoadError] = useState<string | null>(
    null
  );
  const [createOpen, setCreateOpen] = useState(false);
  const [celebrateProjectId, setCelebrateProjectId] = useState<string | null>(
    null
  );
  const [removeTarget, setRemoveTarget] = useState<ProjectSummary | null>(null);

  const refreshProjects = useCallback(
    async (opts?: { showLoading?: boolean }) => {
      if (opts?.showLoading) {
        setProjectsLoading(true);
      }
      const supabase = createClient();
      const { data, error } = await fetchWorkspaceProjects(supabase);
      if (error) {
        setProjectsLoadError(error.message);
        setProjects([]);
      } else {
        setProjectsLoadError(null);
        setProjects(data);
      }
      setProjectsHydrated(true);
      setProjectsLoading(false);
    },
    []
  );

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      void refreshProjects();
    });
    return () => cancelAnimationFrame(id);
  }, [refreshProjects]);

  useEffect(() => {
    if (!celebrateProjectId) return;
    const t = window.setTimeout(() => setCelebrateProjectId(null), CELEBRATION_MS);
    return () => window.clearTimeout(t);
  }, [celebrateProjectId]);

  const addProject = useCallback((p: ProjectSummary) => {
    setProjects((prev) => [p, ...prev]);
    setCelebrateProjectId(p.id);
  }, []);

  const removeProject = useCallback((id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const requestRemoveProject = useCallback((project: ProjectSummary) => {
    setRemoveTarget(project);
  }, []);

  const handleConfirmRemoveProject = useCallback(
    async (project: ProjectSummary) => {
      const supabase = createClient();

      const { error: membersError } = await supabase
        .from("project_members")
        .delete()
        .eq("project_id", project.id);

      if (membersError) {
        console.error("Supabase delete project_members:", membersError.message);
        setProjectsLoadError(
          `Could not remove project: ${membersError.message}`
        );
        setRemoveTarget(null);
        return;
      }

      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", project.id);

      if (error) {
        console.error("Supabase delete project:", error.message);
        setProjectsLoadError(`Could not remove project: ${error.message}`);
        setRemoveTarget(null);
        return;
      }

      removeProject(project.id);
      setRemoveTarget(null);
      setProjectsLoadError(null);
    },
    [removeProject]
  );

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
      projectsHydrated,
      projectsLoading,
      projectsLoadError,
      openCreateProjectModal: () => setCreateOpen(true),
      atProjectLimit: atLimit,
      celebrateProjectId,
      requestRemoveProject,
      removeProject,
      updateProject,
      refreshProjects,
    }),
    [
      projects,
      projectsHydrated,
      projectsLoading,
      projectsLoadError,
      atLimit,
      celebrateProjectId,
      requestRemoveProject,
      removeProject,
      updateProject,
      refreshProjects,
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
        creatorMemberRole={CREATOR_PROJECT_MEMBER_ROLE}
      />
      <RemoveProjectConfirmModal
        project={removeTarget}
        onCancel={() => setRemoveTarget(null)}
        onConfirm={handleConfirmRemoveProject}
      />
    </ProjectsWorkspaceContext.Provider>
  );
}
