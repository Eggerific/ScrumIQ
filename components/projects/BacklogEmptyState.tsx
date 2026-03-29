"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  ClipboardList,
  Layers,
  Package,
  Sparkles,
  FileStack,
  Compass,
} from "lucide-react";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";
import { OrbitalEmptyHero } from "@/components/projects/OrbitalEmptyHero";

const easeSmooth = [0.25, 0.1, 0.25, 1] as const;

type BacklogEmptyStateProps = {
  projectId: string;
  projectName: string;
};

export function BacklogEmptyState({
  projectId,
  projectName,
}: BacklogEmptyStateProps) {
  const reduceMotion = usePrefersReducedMotion();
  const [ctaHovered, setCtaHovered] = useState(false);
  const boostOrbit = !reduceMotion && ctaHovered;

  const iconCls =
    "block size-3.5 shrink-0 text-[var(--app-accent)]";

  /** Distinct from Projects empty state (FolderKanban, ListTodo, GitBranch, …) */
  const outerIcons = [
    { angle: 0, icon: <ClipboardList className={iconCls} strokeWidth={2} aria-hidden /> },
    { angle: 60, icon: <Layers className={iconCls} strokeWidth={2} aria-hidden /> },
    { angle: 120, icon: <Package className={iconCls} strokeWidth={2} aria-hidden /> },
    { angle: 180, icon: <Sparkles className={iconCls} strokeWidth={2} aria-hidden /> },
    { angle: 240, icon: <FileStack className={iconCls} strokeWidth={2} aria-hidden /> },
    { angle: 300, icon: <Compass className={iconCls} strokeWidth={2} aria-hidden /> },
  ];

  return (
    <div className="flex min-h-[min(520px,calc(100vh-10rem))] flex-col items-center justify-center px-4 py-8">
      <div className="relative flex w-full max-w-lg flex-col items-center">
        <OrbitalEmptyHero
          boostOrbit={boostOrbit}
          reduceMotion={reduceMotion}
          outerIcons={outerIcons}
        />

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.12, ease: easeSmooth }}
          className="text-center"
        >
          <h2
            className="text-xl font-semibold tracking-tight md:text-2xl"
            style={{ color: "var(--foreground)" }}
          >
            No backlog items yet
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-zinc-500 md:text-base">
            Run AI Generation for{" "}
            <span className="font-medium text-zinc-400">{projectName}</span>, then
            confirm to land your draft here for this browser session.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.28, ease: easeSmooth }}
          className="mt-10 flex w-full flex-col items-center gap-4"
        >
          <motion.div
            onMouseEnter={() => setCtaHovered(true)}
            onMouseLeave={() => setCtaHovered(false)}
            whileHover={reduceMotion ? undefined : { scale: 1.02 }}
            whileTap={reduceMotion ? undefined : { scale: 0.98 }}
            transition={{ duration: 0.2, ease: easeSmooth }}
          >
            <Link
              href={`/projects/${projectId}/brief`}
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl px-7 py-3.5 text-sm font-semibold shadow-[0_0_32px_-6px_oklch(0.65_0.19_165_/_0.55)] md:px-8 md:text-base"
              style={{
                background: "var(--app-accent)",
                color: "var(--background)",
              }}
            >
              <span
                className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl"
                aria-hidden
              >
                <span
                  className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-[650ms] ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:translate-x-full"
                  aria-hidden
                />
              </span>
              <Sparkles
                className="relative z-10 h-4 w-4 shrink-0 opacity-90 md:h-[1.125rem] md:w-[1.125rem]"
                strokeWidth={2.5}
                aria-hidden
              />
              <span className="relative z-10">Open AI Generation</span>
            </Link>
          </motion.div>

          <Link
            href={`/projects/${projectId}`}
            className="rounded-lg px-4 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-[var(--app-nav-hover-bg)] hover:text-[var(--foreground)]"
          >
            Project home
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
