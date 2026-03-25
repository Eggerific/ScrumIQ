import type { Metadata } from "next";
import { ProjectWorkspaceView } from "@/components/projects/ProjectWorkspaceView";

export const metadata: Metadata = {
  title: "Project",
};

interface ProjectPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params;
  return <ProjectWorkspaceView projectId={id} />;
}
