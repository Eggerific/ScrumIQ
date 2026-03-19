import type { Metadata } from "next";
import { PageShell } from "@/components/app/PageShell";

export const metadata: Metadata = {
  title: "Project",
};

interface ProjectPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params;
  return (
    <PageShell
      title="Project"
      subtitle={`Use the sidebar to open Backlog, Sprint, Kanban, or Team.`}
    />
  );
}
