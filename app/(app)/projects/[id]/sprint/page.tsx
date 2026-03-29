"use client";

import { useParams } from "next/navigation";
import { ProjectScopedPlaceholder } from "@/components/projects/ProjectScopedPlaceholder";

export default function ProjectSprintPage() {
  const params = useParams();
  const projectId = typeof params.id === "string" ? params.id : "";
  return <ProjectScopedPlaceholder projectId={projectId} areaLabel="Sprint" />;
}
