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
    openCreateProjectModal,
    atProjectLimit,
    requestRemoveProject,
  } = useProjectsWorkspace();

  const showPreviewGrid = DESIGN_CARD_PREVIEW && projects.length === 0;
  const gridProjects = showPreviewGrid ? DEMO_PROJECTS : projects;

  return (
    <div className="relative isolate min-h-0 min-w-0">
      <ProjectsPageAtmosphere className="absolute inset-0 -z-10" />
      <div className="relative z-0">
        <PageShell title="Projects">
          {projects.length === 0 && !showPreviewGrid ? (
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
