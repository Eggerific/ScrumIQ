"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight, FolderKanban, Plus, Trash2 } from "lucide-react";
import { MAX_PROJECTS_ON_WORKSPACE_LIST } from "@/lib/projects/constants";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";
import { cn } from "@/lib/utils";
import { useProjectsWorkspace } from "./ProjectsWorkspaceProvider";
import {
  PROJECT_ROLE_LABELS,
  type ProjectSummary,
} from "./project-types";

const easeSmooth = [0.25, 0.1, 0.25, 1] as const;
const easeOutSoft = [0.22, 1, 0.36, 1] as const;

/** @deprecated use MAX_PROJECTS_ON_WORKSPACE_LIST from @/lib/projects/constants */
export const MAX_PROJECT_CARDS_ON_PAGE = MAX_PROJECTS_ON_WORKSPACE_LIST;

const CORNER_ENTRANCE = [
  { x: -36, y: -36, rotate: -2.5 },
  { x: 36, y: -36, rotate: 2.5 },
  { x: -36, y: 36, rotate: 2.5 },
  { x: 36, y: 36, rotate: -2.5 },
] as const;

/** Subtle L-brackets; main hover emphasis is full-perimeter glow on the card. */
function CornerFrame() {
  const arm =
    "pointer-events-none absolute border-[var(--app-accent)]/35 transition-all duration-300 ease-out opacity-30 group-hover:opacity-55 group-hover:border-[var(--app-accent)]/60";
  return (
    <>
      <span
        className={cn(
          arm,
          "left-5 top-5 h-9 w-9 origin-top-left rounded-tl-lg border-l-2 border-t-2"
        )}
        aria-hidden
      />
      <span
        className={cn(
          arm,
          "right-5 top-5 h-9 w-9 origin-top-right rounded-tr-lg border-r-2 border-t-2"
        )}
        aria-hidden
      />
      <span
        className={cn(
          arm,
          "bottom-5 left-5 h-9 w-9 origin-bottom-left rounded-bl-lg border-b-2 border-l-2"
        )}
        aria-hidden
      />
      <span
        className={cn(
          arm,
          "bottom-5 right-5 h-9 w-9 origin-bottom-right rounded-br-lg border-b-2 border-r-2"
        )}
        aria-hidden
      />
    </>
  );
}

function roleLabel(p: ProjectSummary): string {
  return p.roleTag
    ? PROJECT_ROLE_LABELS[p.roleTag]
    : PROJECT_ROLE_LABELS.product_manager;
}

function ProjectCreateCelebration({
  reducedMotion,
}: {
  reducedMotion: boolean;
}) {
  if (reducedMotion) {
    return (
      <span
        className="pointer-events-none absolute inset-0 z-[4] flex items-center justify-center overflow-hidden rounded-2xl"
        aria-hidden
      >
        <motion.span
          className="absolute h-28 w-28 rounded-full border-2 border-[var(--app-accent)]/45"
          initial={{ scale: 0.5, opacity: 0.7 }}
          animate={{ scale: 1.5, opacity: 0 }}
          transition={{ duration: 0.5, ease: easeOutSoft }}
        />
      </span>
    );
  }
  const bursts = Array.from({ length: 9 }, (_, i) => ({
    a: (i / 9) * Math.PI * 2,
    d: 36 + (i % 4) * 14,
    delay: i * 0.025,
  }));
  return (
    <span
      className="pointer-events-none absolute inset-0 z-[4] overflow-hidden rounded-2xl"
      aria-hidden
    >
      <motion.span
        className="absolute left-1/2 top-1/2 h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[var(--app-accent)]/50"
        initial={{ scale: 0.35, opacity: 0.75 }}
        animate={{ scale: 2.4, opacity: 0 }}
        transition={{ duration: 0.7, ease: easeOutSoft }}
      />
      {bursts.map((b, i) => (
        <motion.span
          key={i}
          className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-[2px] bg-[var(--app-accent)] shadow-[0_0_10px_oklch(0.65_0.19_165_/_0.6)]"
          initial={{ opacity: 1, scale: 1, x: 0, y: 0 }}
          animate={{
            opacity: 0,
            scale: 0.2,
            x: Math.cos(b.a) * b.d,
            y: Math.sin(b.a) * b.d,
          }}
          transition={{ duration: 0.58, delay: b.delay, ease: easeOutSoft }}
        />
      ))}
    </span>
  );
}

function WorkspaceBenchFullCallout() {
  return (
    <div
      className="mb-2 flex max-w-full flex-col gap-3 rounded-2xl border border-[var(--app-accent)]/22 bg-[oklch(0.22_0.04_165/0.14)] px-4 py-3 sm:flex-row sm:items-center sm:gap-4 sm:px-5 sm:py-3.5"
      role="status"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="mx-auto h-14 w-14 shrink-0 text-amber-400/95 sm:mx-0"
        aria-hidden
      >
        <path
          d="M11.9998 8.99999V13M11.9998 17H12.0098M10.6151 3.89171L2.39019 18.0983C1.93398 18.8863 1.70588 19.2803 1.73959 19.6037C1.769 19.8857 1.91677 20.142 2.14613 20.3088C2.40908 20.5 2.86435 20.5 3.77487 20.5H20.2246C21.1352 20.5 21.5904 20.5 21.8534 20.3088C22.0827 20.142 22.2305 19.8857 22.2599 19.6037C22.2936 19.2803 22.0655 18.8863 21.6093 18.0983L13.3844 3.89171C12.9299 3.10654 12.7026 2.71396 12.4061 2.58211C12.1474 2.4671 11.8521 2.4671 11.5935 2.58211C11.2969 2.71396 11.0696 3.10655 10.6151 3.89171Z"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="min-w-0 text-center sm:text-left">
        <p className="text-base font-semibold text-[var(--foreground)]">
          Bench is full — make room?
        </p>
        <p className="mt-1 text-sm leading-relaxed text-zinc-500">
          You&apos;re at {MAX_PROJECTS_ON_WORKSPACE_LIST}/
          {MAX_PROJECTS_ON_WORKSPACE_LIST} on this workspace. Remove a project
          from the grid (or sidebar) to free a slot.
        </p>
      </div>
    </div>
  );
}

interface ProjectsGridProps {
  projects: ProjectSummary[];
  onCreateClick: () => void;
  isPreview?: boolean;
  atProjectLimit?: boolean;
  /** When set, filled cards show remove (workspace list only; not preview). */
  onRemoveProject?: (project: ProjectSummary) => void;
}

export function ProjectsGrid({
  projects,
  onCreateClick,
  isPreview = false,
  atProjectLimit = false,
  onRemoveProject,
}: ProjectsGridProps) {
  const { celebrateProjectId } = useProjectsWorkspace();
  const reducedMotion = usePrefersReducedMotion();

  const slots: (ProjectSummary | null)[] = Array.from(
    { length: MAX_PROJECTS_ON_WORKSPACE_LIST },
    (_, i) => projects[i] ?? null
  );

  return (
    <div className="space-y-8">
      {isPreview ? (
        <p
          className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-sm text-amber-100/90"
          role="note"
        >
          Preview — sample data.
        </p>
      ) : null}

      {!isPreview && atProjectLimit ? <WorkspaceBenchFullCallout /> : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-zinc-500">
          {projects.length}/{MAX_PROJECTS_ON_WORKSPACE_LIST}
        </p>
        <motion.button
          type="button"
          onClick={onCreateClick}
          disabled={atProjectLimit}
          whileHover={
            atProjectLimit || reducedMotion ? undefined : { scale: 1.02 }
          }
          whileTap={
            atProjectLimit || reducedMotion ? undefined : { scale: 0.98 }
          }
          transition={{ duration: 0.2, ease: easeSmooth }}
          title={atProjectLimit ? "Workspace full" : undefined}
          className={cn(
            "inline-flex items-center justify-center gap-2 self-start rounded-xl px-5 py-2.5 text-sm font-semibold sm:self-auto",
            atProjectLimit ? "cursor-not-allowed opacity-50" : ""
          )}
          style={{
            background: "var(--app-accent)",
            color: "var(--background)",
          }}
        >
          <FolderKanban className="h-4 w-4" aria-hidden />
          New project
        </motion.button>
      </div>

      <ul className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8">
        {slots.map((p, i) => {
          const ent = CORNER_ENTRANCE[Math.min(i, 3)];
          if (p) {
            return (
              <motion.li
                key={p.id}
                className="min-w-0"
                initial={{
                  opacity: 0,
                  x: ent.x,
                  y: ent.y,
                  rotate: ent.rotate,
                  filter: "blur(6px)",
                }}
                animate={{
                  opacity: 1,
                  x: 0,
                  y: 0,
                  rotate: 0,
                  filter: "blur(0px)",
                }}
                transition={{
                  duration: 0.55,
                  delay: 0.08 + i * 0.11,
                  ease: easeOutSoft,
                }}
              >
                <motion.div
                  whileHover={
                    isPreview
                      ? undefined
                      : {
                          y: -6,
                          transition: { duration: 0.28, ease: easeSmooth },
                        }
                  }
                  whileTap={isPreview ? undefined : { scale: 0.99 }}
                  className="h-full"
                >
                  <div
                    className={cn(
                      "group relative flex h-full min-h-[min(280px,42vw)] flex-col overflow-hidden rounded-2xl border transition-[border-color,box-shadow,background-color] duration-300 md:min-h-[300px]",
                      isPreview
                        ? "cursor-default border-dashed border-zinc-600/50 bg-[var(--auth-card)]/35"
                        : cn(
                            "border-[var(--app-sidebar-border)] bg-gradient-to-br from-[var(--auth-card)]/75 via-[var(--auth-card)]/55 to-[var(--background)]/25",
                            "hover:border-[var(--app-accent)]/45",
                            "hover:shadow-[0_0_0_2px_oklch(0.65_0.19_165_/_0.55),0_24px_72px_-22px_oklch(0.65_0.19_165_/_0.42)]"
                          )
                    )}
                  >
                    <CornerFrame />
                    <span
                      className={cn(
                        "pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100",
                        !isPreview &&
                          "bg-[radial-gradient(ellipse_at_50%_20%,oklch(0.65_0.19_165_/_0.12),transparent_60%)]"
                      )}
                      aria-hidden
                    />

                    {!isPreview && celebrateProjectId === p.id ? (
                      <ProjectCreateCelebration
                        reducedMotion={reducedMotion}
                      />
                    ) : null}

                    {isPreview ? (
                      <span className="absolute right-5 top-5 z-10 rounded-md border border-zinc-600/50 bg-zinc-900/70 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                        Sample
                      </span>
                    ) : onRemoveProject ? (
                      <button
                        type="button"
                        onClick={() => onRemoveProject(p)}
                        className="absolute right-4 top-4 z-20 rounded-lg border border-[var(--app-sidebar-border)]/70 bg-[var(--background)]/85 p-2 text-zinc-500 shadow-sm backdrop-blur-sm transition-colors hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-500/25"
                        aria-label={`Remove ${p.name} from workspace`}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </button>
                    ) : null}

                    <Link
                      href={isPreview ? "#" : `/projects/${p.id}`}
                      onClick={isPreview ? (e) => e.preventDefault() : undefined}
                      className="relative z-[1] flex min-h-0 flex-1 flex-col gap-4 p-6 outline-none ring-offset-2 ring-offset-[var(--auth-card)] transition-[color] duration-300 md:p-8 focus-visible:ring-2 focus-visible:ring-[var(--app-accent)]/50"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md border border-[var(--app-sidebar-border)] bg-[var(--background)]/50 px-2.5 py-1 text-xs font-medium text-zinc-300">
                          {roleLabel(p)}
                        </span>
                      </div>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 flex-1 items-start gap-4">
                          <motion.span
                            className={cn(
                              "mt-1.5 h-3 w-3 shrink-0 rounded-full shadow-[0_0_16px_-2px_currentColor]",
                              p.dotClass
                            )}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{
                              type: "spring",
                              stiffness: 400,
                              damping: 22,
                              delay: 0.25 + i * 0.1,
                            }}
                            aria-hidden
                          />
                          <div className="min-w-0 flex-1">
                            <h3 className="line-clamp-2 text-lg font-semibold leading-snug tracking-tight text-[var(--foreground)] md:text-xl">
                              {p.name}
                            </h3>
                            {p.description ? (
                              <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-zinc-400 md:text-base">
                                {p.description}
                              </p>
                            ) : (
                              <p className="mt-3 text-sm italic text-zinc-600 md:text-base">
                                No description yet
                              </p>
                            )}
                          </div>
                        </div>
                        <motion.span
                          className="shrink-0"
                          initial={{ opacity: 0, x: 8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{
                            delay: 0.45 + i * 0.08,
                            duration: 0.35,
                            ease: easeSmooth,
                          }}
                        >
                          <ChevronRight
                            className={cn(
                              "h-6 w-6 text-zinc-500 transition-all duration-300 md:h-7 md:w-7",
                              !isPreview &&
                                "group-hover:translate-x-1 group-hover:text-[var(--app-accent)]"
                            )}
                            strokeWidth={1.75}
                            aria-hidden
                          />
                        </motion.span>
                      </div>

                      {p.updatedLabel ? (
                        <p className="mt-auto border-t border-[var(--app-sidebar-border)]/80 pt-4 text-xs font-medium uppercase tracking-wider text-zinc-600">
                          {p.updatedLabel}
                        </p>
                      ) : null}
                    </Link>
                  </div>
                </motion.div>
              </motion.li>
            );
          }

          return (
            <motion.li
              key={`empty-slot-${i}`}
              className="min-w-0"
              initial={{
                opacity: 0,
                x: ent.x,
                y: ent.y,
                rotate: ent.rotate,
                filter: "blur(6px)",
              }}
              animate={{
                opacity: 1,
                x: 0,
                y: 0,
                rotate: 0,
                filter: "blur(0px)",
              }}
              transition={{
                duration: 0.55,
                delay: 0.08 + i * 0.11,
                ease: easeOutSoft,
              }}
            >
              <motion.div
                whileHover={
                  atProjectLimit
                    ? undefined
                    : { y: -4, transition: { duration: 0.25, ease: easeSmooth } }
                }
                className="h-full"
              >
                <button
                  type="button"
                  onClick={onCreateClick}
                  disabled={atProjectLimit}
                  className={cn(
                    "group relative flex h-full min-h-[min(280px,42vw)] w-full flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-[var(--app-sidebar-border)] bg-[var(--auth-card)]/25 p-8 text-center transition-all duration-300 md:min-h-[300px]",
                    !atProjectLimit &&
                      "hover:border-[var(--app-accent)]/40 hover:bg-[var(--auth-card)]/40 hover:shadow-[0_0_0_2px_oklch(0.65_0.19_165_/_0.35),0_20px_50px_-24px_oklch(0.65_0.19_165_/_0.25)]",
                    atProjectLimit && "cursor-not-allowed opacity-50"
                  )}
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--app-sidebar-border)] bg-[var(--background)]/40 text-[var(--app-accent)] transition-colors group-hover:border-[var(--app-accent)]/35">
                    <Plus className="h-7 w-7" strokeWidth={2} aria-hidden />
                  </span>
                  <div>
                    <p className="text-base font-semibold text-zinc-300">
                      {atProjectLimit ? "Full" : "Open slot"}
                    </p>
                    {atProjectLimit ? (
                      <p className="mt-1 max-w-[220px] text-sm text-zinc-600">
                        Remove one to add another.
                      </p>
                    ) : null}
                  </div>
                </button>
              </motion.div>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}
