"use client";

import { useParams } from "next/navigation";
import { ProjectBacklogView } from "@/components/projects/ProjectBacklogView";

export default function ProjectBacklogPage() {
  const params = useParams();
  const projectId = typeof params.id === "string" ? params.id : "";
  return <ProjectBacklogView key={projectId} projectId={projectId} />;
}
