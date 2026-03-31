"use client";

import { useParams } from "next/navigation";
import { ProjectScopedPlaceholder } from "@/components/projects/ProjectScopedPlaceholder";

export default function ProjectTeamPage() {
  const params = useParams();
  const projectId = typeof params.id === "string" ? params.id : "";
  return <ProjectScopedPlaceholder projectId={projectId} areaLabel="Team" />;
}
