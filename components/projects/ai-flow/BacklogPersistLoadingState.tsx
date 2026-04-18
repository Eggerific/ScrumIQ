"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Bookmark, Database, Package, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";

const PIPELINE = [
  {
    title: "Packaging your backlog",
    shortLabel: "Package",
    detail:
      "We’re bundling every epic, story, criterion, and task you reviewed into one clean payload for the server.",
    Icon: Package,
  },
  {
    title: "Writing to your project",
    shortLabel: "Save",
    detail:
      "Your workspace is updating — this step replaces prior backlog rows for this project with what you confirmed.",
    Icon: Database,
  },
  {
    title: "Anchoring a session copy",
    shortLabel: "Session",
    detail:
      "We keep a draft in this browser so you can keep editing on the Backlog tab without losing your place.",
    Icon: Bookmark,
  },
  {
    title: "Handoff to Backlog",
    shortLabel: "Launch",
    detail:
      "Next you’ll land on Backlog to tweak wording, add detail, and plan the next slice of work.",
    Icon: Rocket,
  },
] as const;

const FOOTNOTES = [
  "Bigger backlogs mean more rows — a longer wait here is normal, not a failure.",
  "Stay on this screen; switching away or closing the tab can interrupt the save.",
  "You’re not stuck — we’ll show a clear error if something needs your attention.",
] as const;

interface BacklogPersistLoadingStateProps {
  projectName?: string;
  className?: string;
}

export function BacklogPersistLoadingState({
  projectName,
  className,
}: BacklogPersistLoadingStateProps) {
  const reduceMotion = useReducedMotion();
  const [stage, setStage] = useState(0);
  const [footnote, setFootnote] = useState(0);

  useEffect(() => {
    if (reduceMotion) return;
    const id = setInterval(() => {
      setStage((s) => (s + 1) % PIPELINE.length);
    }, 2800);
    return () => clearInterval(id);
  }, [reduceMotion]);

  useEffect(() => {
    if (reduceMotion) return;
    const id = setInterval(() => {
      setFootnote((f) => (f + 1) % FOOTNOTES.length);
    }, 6000);
    return () => clearInterval(id);
  }, [reduceMotion]);

  const active = reduceMotion ? 0 : stage;
  const current = PIPELINE[active];
  const StageIcon = current.Icon;

  return (
    <div
      className={cn(
        "flex flex-col items-center px-2 py-8 md:py-10",
        className
      )}
      aria-busy
      aria-live="polite"
    >
      <span className="sr-only">
        Saving backlog to project. Current step: {current.title}.
      </span>

      <div className="relative mb-8 flex h-28 w-full max-w-[220px] items-center justify-center">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ zIndex: 3 - i }}
            aria-hidden
          >
            <motion.div
              className={cn(
                "h-[5.5rem] w-[188px] rounded-xl border border-[var(--app-accent)]/25 bg-[var(--background)]/95 shadow-[0_10px_36px_-18px_oklch(0.65_0.19_165_/_0.4)]",
                "backdrop-blur-[2px]"
              )}
              style={{ rotate: (i - 1) * 3.5 }}
              animate={
                reduceMotion
                  ? {}
                  : {
                      y: [0, -5 - i * 2, 0],
                      opacity: [0.4 + i * 0.12, 0.72 + i * 0.08, 0.4 + i * 0.12],
                    }
              }
              transition={{
                duration: 2.6,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.1,
              }}
            >
              <div className="flex h-full flex-col justify-center gap-1.5 px-3.5 py-2.5">
                <div className="h-1.5 w-2/5 rounded-full bg-emerald-500/25" />
                <div className="h-1.5 w-full rounded-full bg-zinc-600/70" />
                <div className="h-1.5 w-3/4 rounded-full bg-zinc-700/65" />
                <div className="mt-1 h-1.5 w-1/2 rounded-full bg-sky-500/20" />
              </div>
            </motion.div>
          </div>
        ))}
        <motion.div
          className="relative z-[20] flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--app-accent)]/50 bg-[var(--app-accent)]/15 shadow-[0_0_28px_-8px_var(--app-accent)]"
          animate={
            reduceMotion
              ? {}
              : { scale: [1, 1.05, 1], opacity: [0.92, 1, 0.92] }
          }
          transition={{ duration: 2.1, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden
        >
          <StageIcon
            className="h-7 w-7 text-[var(--app-accent)]"
            strokeWidth={1.5}
          />
        </motion.div>
      </div>

      <div className="w-full max-w-md text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.title}
            initial={reduceMotion ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -5 }}
            transition={{ duration: 0.32, ease: "easeOut" }}
          >
            <h3 className="text-base font-semibold tracking-tight text-[var(--foreground)] md:text-lg">
              {current.title}
            </h3>
            <p className="mt-2.5 text-pretty text-sm leading-relaxed text-zinc-400 md:text-[15px]">
              {current.detail}
            </p>
          </motion.div>
        </AnimatePresence>

        {projectName ? (
          <p className="mt-3 text-xs font-medium uppercase tracking-wider text-[var(--app-accent)]/80">
            Project: {projectName}
          </p>
        ) : null}
      </div>

      <div className="mt-8 w-full max-w-sm">
        <div className="relative h-2 overflow-hidden rounded-full bg-zinc-800/90">
          {reduceMotion ? (
            <div
              className="mx-auto h-full w-3/5 rounded-full bg-[var(--app-accent)]/45"
              aria-hidden
            />
          ) : (
            <motion.div
              className="absolute top-0 h-full w-[40%] min-w-24 rounded-full bg-gradient-to-r from-transparent via-[var(--app-accent)] to-transparent opacity-90"
              initial={false}
              animate={{ x: ["-100%", "340%"] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: "linear" }}
              aria-hidden
            />
          )}
        </div>
        <p className="mt-2.5 text-center text-xs text-zinc-500">
          Network and database time vary — hang tight, we&apos;ve got it.
        </p>
      </div>

      <ul
        className="mt-8 flex w-full max-w-lg flex-wrap justify-center gap-2 md:gap-2.5"
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
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[11px] font-medium md:text-xs",
                  done
                    ? "border-[var(--app-accent)]/40 bg-[var(--app-accent)]/10 text-zinc-200"
                    : currentStep
                      ? "border-[var(--app-accent)]/55 bg-[var(--app-accent)]/15 text-zinc-100"
                      : "border-zinc-700/80 bg-zinc-900/40 text-zinc-500"
                )}
                animate={
                  reduceMotion || !currentStep
                    ? {}
                    : {
                        boxShadow: [
                          "0 0 0 0 oklch(0.65 0.19 165 / 0)",
                          "0 0 18px 0 oklch(0.65 0.19 165 / 0.22)",
                          "0 0 0 0 oklch(0.65 0.19 165 / 0)",
                        ],
                      }
                }
                transition={{ duration: 2, repeat: Infinity }}
              >
                <StepIcon className="h-3 w-3 shrink-0 opacity-80" aria-hidden />
                {step.shortLabel}
                {done ? " ✓" : ""}
              </motion.span>
            </li>
          );
        })}
      </ul>

      <AnimatePresence mode="wait">
        <motion.p
          key={footnote}
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="mt-6 max-w-md text-center text-sm italic leading-relaxed text-zinc-500"
        >
          {FOOTNOTES[footnote]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
