import type { Metadata } from "next";
import { PageShell } from "@/components/app/PageShell";

export const metadata: Metadata = {
  title: "Projects",
};

export default function ProjectsPage() {
  return (
    <PageShell
      title="Projects"
      subtitle="Your projects will appear here"
    />
  );
}
