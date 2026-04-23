"use client";

import { useParams } from "next/navigation";
import { KanbanBoard } from "@/components/projects/KanbanBoard";

export default function ProjectKanbanPage() {
  const params = useParams();
  const projectId = typeof params.id === "string" ? params.id : "";
  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)] md:text-3xl">
          Kanban
        </h1>
        <div
          className="mt-1.5 h-0.5 w-12 rounded-full"
          style={{ background: "var(--app-accent)" }}
          aria-hidden
        />
      </div>
      <KanbanBoard projectId={projectId} />
    </div>
  );
}
