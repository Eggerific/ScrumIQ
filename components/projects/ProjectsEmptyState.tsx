"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  ListTodo,
  GitBranch,
  LayoutGrid,
  Users,
  FolderKanban,
  Target,
} from "lucide-react";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";
import { OrbitalEmptyHero } from "@/components/projects/OrbitalEmptyHero";

const easeSmooth = [0.25, 0.1, 0.25, 1] as const;

interface ProjectsEmptyStateProps {
  onCreateClick: () => void;
}

export function ProjectsEmptyState({ onCreateClick }: ProjectsEmptyStateProps) {
  const reduceMotion = usePrefersReducedMotion();
  const [createHovered, setCreateHovered] = useState(false);
  const boostOrbit = !reduceMotion && createHovered;

  const iconCls =
    "block size-3.5 shrink-0 text-[var(--app-accent)]";

  const outerIcons = [
    { angle: 0, icon: <FolderKanban className={iconCls} strokeWidth={2} aria-hidden /> },
    { angle: 60, icon: <ListTodo className={iconCls} strokeWidth={2} aria-hidden /> },
    { angle: 120, icon: <GitBranch className={iconCls} strokeWidth={2} aria-hidden /> },
    { angle: 180, icon: <LayoutGrid className={iconCls} strokeWidth={2} aria-hidden /> },
    { angle: 240, icon: <Users className={iconCls} strokeWidth={2} aria-hidden /> },
    { angle: 300, icon: <Target className={iconCls} strokeWidth={2} aria-hidden /> },
  ];

  return (
    <div className="flex min-h-[min(560px,calc(100vh-12rem))] flex-col items-center justify-center px-4 py-12">
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
            No projects yet
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-zinc-500 md:text-base">
            Create a project to get started.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.28, ease: easeSmooth }}
          className="mt-10"
        >
          <motion.button
            type="button"
            onClick={onCreateClick}
            onMouseEnter={() => setCreateHovered(true)}
            onMouseLeave={() => setCreateHovered(false)}
            onFocus={() => setCreateHovered(true)}
            onBlur={() => setCreateHovered(false)}
            whileHover={reduceMotion ? undefined : { scale: 1.02 }}
            whileTap={reduceMotion ? undefined : { scale: 0.98 }}
            transition={{ duration: 0.2, ease: easeSmooth }}
            className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl px-7 py-3.5 text-sm font-semibold shadow-[0_0_32px_-6px_oklch(0.65_0.19_165_/_0.55)] md:px-8 md:text-base"
            style={{
              background: "var(--app-accent)",
              color: "var(--background)",
            }}
          >
            <motion.span
              className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              initial={{ x: "-120%" }}
              whileHover={reduceMotion ? undefined : { x: "120%" }}
              transition={{ duration: 0.65, ease: easeSmooth }}
              aria-hidden
            />
            <Plus
              className="relative z-10 h-4 w-4 shrink-0 opacity-90 md:h-[1.125rem] md:w-[1.125rem]"
              strokeWidth={2.5}
              aria-hidden
            />
            <span className="relative z-10">New project</span>
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
