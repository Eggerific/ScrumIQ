"use client";

import { cn } from "@/lib/utils";

/**
 * Extra slow green mesh behind the projects page content (AppMain gradient stays underneath).
 * Motion is CSS-only; prefers-reduced-motion removes animation in globals.css.
 */
export function ProjectsPageAtmosphere({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      className={cn(
        "pointer-events-none select-none overflow-hidden",
        className
      )}
      aria-hidden
    >
      <div
        className="projects-aurora-blob-a absolute -left-[18%] top-[-25%] h-[min(72vh,520px)] w-[min(72vw,520px)] rounded-full bg-[radial-gradient(circle,oklch(0.55_0.16_165/0.35)_0%,transparent_68%)] blur-3xl"
      />
      <div
        className="projects-aurora-blob-b absolute -right-[12%] bottom-[-20%] h-[min(65vh,480px)] w-[min(65vw,480px)] rounded-full bg-[radial-gradient(circle,oklch(0.45_0.12_175/0.28)_0%,transparent_70%)] blur-3xl"
      />
      <div
        className="projects-aurora-blob-c absolute left-[25%] top-[35%] h-[min(50vh,360px)] w-[min(55vw,400px)] rounded-full bg-[radial-gradient(ellipse_at_center,oklch(0.6_0.14_155/0.12)_0%,transparent_72%)] blur-[80px]"
      />
    </div>
  );
}
