"use client";

import { PageShell } from "@/components/app/PageShell";
import { DEMO_PROJECTS } from "./demo-projects";
import { ProjectsEmptyState } from "./ProjectsEmptyState";
import { ProjectsGrid } from "./ProjectsGrid";
import { ProjectsPageAtmosphere } from "./ProjectsPageAtmosphere";
import { useProjectsWorkspace } from "./ProjectsWorkspaceProvider";

/**
 * When true and there are zero projects in workspace, show the sample grid
 * instead of the orbital empty state (layout / styling only).
 */
const DESIGN_CARD_PREVIEW = false;

export function ProjectsView() {
  const {
    projects,
    projectsHydrated,
    projectsLoading,
    projectsLoadError,
    refreshProjects,
    openCreateProjectModal,
    atProjectLimit,
    requestRemoveProject,
  } = useProjectsWorkspace();

  const showPreviewGrid = DESIGN_CARD_PREVIEW && projects.length === 0;
  const gridProjects = showPreviewGrid ? DEMO_PROJECTS : projects;
  const showInitialLoading = projectsLoading && !projectsHydrated;

  return (
    <div className="relative isolate min-h-0 min-w-0">
      <ProjectsPageAtmosphere className="absolute inset-0 -z-10" />
      <div className="relative z-0">
        <PageShell title="Projects">
          {projectsLoadError ? (
            <div
              className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100/90"
              role="alert"
            >
              <p className="font-medium text-red-50/95">{projectsLoadError}</p>
              <button
                type="button"
                onClick={() => void refreshProjects({ showLoading: true })}
                className="mt-2 text-xs font-medium text-red-200 underline-offset-2 hover:underline"
              >
                Try again
              </button>
            </div>
          ) : null}

          {showInitialLoading ? (
            <p className="text-sm text-zinc-500">Loading projects…</p>
          ) : projects.length === 0 && !showPreviewGrid ? (
            <ProjectsEmptyState onCreateClick={openCreateProjectModal} />
          ) : (
            <ProjectsGrid
              projects={gridProjects}
              isPreview={showPreviewGrid}
              atProjectLimit={atProjectLimit}
              onCreateClick={openCreateProjectModal}
              onRemoveProject={
                showPreviewGrid ? undefined : requestRemoveProject
              }
            />
          )}
        </PageShell>
      </div>
    </div>
  );
}
