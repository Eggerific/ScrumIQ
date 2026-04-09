"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Layers, ListChecks, ListTree, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const PIPELINE = [
  {
    title: "Absorbing your context",
    detail: "Your vision and constraints become the backbone of what we generate next.",
    Icon: Layers,
  },
  {
    title: "Shaping epics",
    detail: "Grouping work into themes so the backlog reads like a story, not a wall of tasks.",
    Icon: ListTree,
  },
  {
    title: "Drafting stories & tasks",
    detail: "Stories, acceptance criteria, and tasks — ready for you to refine, not finalize.",
    Icon: ListChecks,
  },
  {
    title: "Polishing for review",
    detail: "You’ll see everything in a moment and stay in control before it lands in Backlog.",
    Icon: Sparkles,
  },
] as const;

const FOOTNOTES = [
  "No permanent changes until you confirm — this is your preview pass.",
  "The first draft is a starting line, not the finish.",
  "You’re almost at the fun part: tuning the plan to match reality.",
] as const;

interface BacklogGenerationLoadingStateProps {
  projectName?: string;
}

export function BacklogGenerationLoadingState({
  projectName,
}: BacklogGenerationLoadingStateProps) {
  const reduceMotion = useReducedMotion();
  const [stage, setStage] = useState(0);
  const [footnote, setFootnote] = useState(0);

  useEffect(() => {
    if (reduceMotion) return;
    const id = setInterval(() => {
      setStage((s) => (s + 1) % PIPELINE.length);
    }, 2400);
    return () => clearInterval(id);
  }, [reduceMotion]);

  useEffect(() => {
    if (reduceMotion) return;
    const id = setInterval(() => {
      setFootnote((f) => (f + 1) % FOOTNOTES.length);
    }, 5200);
    return () => clearInterval(id);
  }, [reduceMotion]);

  const active = reduceMotion ? 0 : stage;
  const current = PIPELINE[active];
  const StageIcon = current.Icon;

  return (
    <div
      className="flex flex-col items-center px-2 py-12 md:py-16"
      aria-busy
      aria-live="polite"
    >
      <span className="sr-only">
        Generating backlog. Current step: {current.title}.
      </span>

      <div className="relative mb-10 flex h-32 w-full max-w-[240px] items-center justify-center">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ zIndex: 3 - i }}
            aria-hidden
          >
            <motion.div
              className={cn(
                "h-24 w-[200px] rounded-xl border border-[var(--app-accent)]/30 bg-[var(--background)]/90 shadow-[0_12px_40px_-20px_oklch(0.65_0.19_165_/_0.35)]",
                "backdrop-blur-[2px]"
              )}
              style={{ rotate: (i - 1) * 4 }}
              animate={
                reduceMotion
                  ? {}
                  : {
                      y: [0, -6 - i * 2, 0],
                      scale: [1, 1.02 - i * 0.02, 1],
                      opacity: [0.45 + i * 0.15, 0.75 + i * 0.08, 0.45 + i * 0.15],
                    }
              }
              transition={{
                duration: 2.8,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.12,
              }}
            >
              <div className="flex h-full flex-col justify-center gap-2 px-4 py-3">
                <div className="h-2 w-3/5 rounded-full bg-zinc-600/80" />
                <div className="h-2 w-full rounded-full bg-zinc-700/70" />
                <div className="h-2 w-4/5 rounded-full bg-zinc-700/60" />
              </div>
            </motion.div>
          </div>
        ))}
        <motion.div
          className="relative z-[20] flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--app-accent)]/50 bg-[var(--app-accent)]/15 shadow-[0_0_32px_-8px_var(--app-accent)]"
          animate={
            reduceMotion
              ? {}
              : { scale: [1, 1.06, 1], opacity: [0.9, 1, 0.9] }
          }
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden
        >
          <StageIcon
            className="h-8 w-8 text-[var(--app-accent)]"
            strokeWidth={1.5}
          />
        </motion.div>
      </div>

      <div className="w-full max-w-md text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.title}
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <h2 className="text-lg font-semibold tracking-tight text-[var(--foreground)] md:text-xl">
              {current.title}
            </h2>
            <p className="mt-3 text-pretty text-sm leading-relaxed text-zinc-400 md:text-base">
              {current.detail}
            </p>
          </motion.div>
        </AnimatePresence>

        {projectName ? (
          <p className="mt-4 text-xs font-medium uppercase tracking-wider text-[var(--app-accent)]/80">
            For “{projectName}”
          </p>
        ) : null}
      </div>

      <div className="mt-10 w-full max-w-sm">
        <div className="relative h-2 overflow-hidden rounded-full bg-zinc-800/90">
          {reduceMotion ? (
            <div
              className="mx-auto h-full w-3/5 rounded-full bg-[var(--app-accent)]/45"
              aria-hidden
            />
          ) : (
            <motion.div
              className="absolute top-0 h-full w-[42%] min-w-24 rounded-full bg-gradient-to-r from-transparent via-[var(--app-accent)] to-transparent opacity-90"
              initial={false}
              animate={{ x: ["-100%", "320%"] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
              aria-hidden
            />
          )}
        </div>
        <p className="mt-3 text-center text-xs text-zinc-500">
          Building your preview — usually just a few seconds.
        </p>
      </div>

      <motion.ul
        className="mt-10 flex w-full max-w-lg flex-wrap justify-center gap-2 md:gap-3"
        initial={false}
        aria-hidden
      >
        {PIPELINE.map((step, i) => {
          const done = i < active;
          const currentStep = i === active;
          const StepIcon = step.Icon;
          return (
            <li key={step.title}>
              <motion.span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors md:text-[13px]",
                  done
                    ? "border-[var(--app-accent)]/40 bg-[var(--app-accent)]/10 text-zinc-200"
                    : currentStep
                      ? "border-[var(--app-accent)]/55 bg-[var(--app-accent)]/15 text-zinc-100"
                      : "border-zinc-700/80 bg-zinc-900/40 text-zinc-500"
                )}
                animate={
                  reduceMotion || !currentStep
                    ? {}
                    : { boxShadow: ["0 0 0 0 oklch(0.65 0.19 165 / 0)", "0 0 20px 0 oklch(0.65 0.19 165 / 0.2)", "0 0 0 0 oklch(0.65 0.19 165 / 0)"] }
                }
                transition={{ duration: 2, repeat: Infinity }}
              >
                <StepIcon className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
                {step.title.split(" ")[0]}
                {done ? " ✓" : ""}
              </motion.span>
            </li>
          );
        })}
      </motion.ul>

      <AnimatePresence mode="wait">
        <motion.p
          key={footnote}
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="mt-8 max-w-sm text-center text-sm italic leading-relaxed text-zinc-500"
        >
          {FOOTNOTES[footnote]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
