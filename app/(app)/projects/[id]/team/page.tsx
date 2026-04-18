"use client";

import { useParams } from "next/navigation";
import { ProjectTeamView } from "@/components/projects/ProjectTeamView";

export default function ProjectTeamPage() {
  const params = useParams();
  const projectId = typeof params.id === "string" ? params.id : "";
  return <ProjectTeamView key={projectId} projectId={projectId} />;
}
