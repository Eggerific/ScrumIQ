"use client";

import { useCallback, useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { FileText, X } from "lucide-react";
import { cn } from "@/lib/utils";

const easeSmooth = [0.25, 0.1, 0.25, 1] as const;

export interface ProjectAiBriefModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Shown in the header for context. */
  projectName: string;
  /**
   * When true, closing or continuing marks the first-visit brief as done
   * (`aiBriefEngagement: "complete"` in the parent). When false (e.g. user opened
   * from “preview” while already skipped), only the modal closes.
   */
  finishEngagementOnDismiss: boolean;
  onFinishEngagement: () => void;
}

const PLANNED_FIELDS = [
  {
    title: "Narrative overview",
    body: "A short assistant-written summary tying your inputs together.",
  },
  {
    title: "Elevator pitch",
    body: "One tight statement suitable for the project card and stakeholders.",
  },
  {
    title: "Goals & non-goals",
    body: "Bulleted outcomes to pursue and explicit scope boundaries to avoid creep.",
  },
  {
    title: "Suggested themes",
    body: "Backlog-friendly epics or themes (title + description each).",
  },
  {
    title: "Risks",
    body: "Delivery and product risks inferred from your context.",
  },
  {
    title: "Acceptance hints",
    body: "Signals for when themes or increments are “good enough” to ship.",
  },
  {
    title: "Free-form context (optional)",
    body: "Echo or digest of extra notes you added so tools and humans stay aligned.",
  },
] as const;

export function ProjectAiBriefModal({
  open,
  onOpenChange,
  projectName,
  finishEngagementOnDismiss,
  onFinishEngagement,
}: ProjectAiBriefModalProps) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const mounted = typeof document !== "undefined";

  const dismiss = useCallback(() => {
    if (finishEngagementOnDismiss) onFinishEngagement();
    onOpenChange(false);
  }, [finishEngagementOnDismiss, onFinishEngagement, onOpenChange]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => closeRef.current?.focus(), 50);
    return () => {
      document.body.style.overflow = prev;
      window.clearTimeout(t);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, dismiss]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          key="project-brief-intro-layer"
          className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.26, ease: easeSmooth }}
        >
          <button
            type="button"
            aria-label="Close dialog"
            className="absolute inset-0 border-0 bg-black/55 backdrop-blur-[2px]"
            onClick={dismiss}
          />
          <motion.div
            role="dialog"
            aria-modal
            aria-labelledby={titleId}
            className="relative z-10 flex max-h-[min(88vh,720px)] w-full max-w-lg flex-col rounded-t-2xl border border-[var(--app-sidebar-border)] bg-[var(--auth-card)] shadow-[0_-8px_40px_-12px_rgba(0,0,0,0.5)] sm:max-w-xl sm:rounded-2xl sm:shadow-2xl"
            initial={{ opacity: 0, y: 48, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 28, scale: 0.98 }}
            transition={{ duration: 0.36, ease: easeSmooth }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[var(--app-sidebar-border)] px-5 py-4 md:px-6">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <FileText
                    className="h-5 w-5 shrink-0 text-[var(--app-accent)]"
                    aria-hidden
                  />
                  <h2
                    id={titleId}
                    className="text-lg font-semibold tracking-tight text-[var(--foreground)]"
                  >
                    AI project brief
                  </h2>
                </div>
                <p className="mt-1 text-sm text-zinc-500">
                  <span className="font-medium text-zinc-400">{projectName}</span>
                  {" — "}
                  generation isn&apos;t wired in this branch. Below is what we plan to
                  return and show after your teammate implements the model + JSON
                  parsing.
                </p>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={dismiss}
                className="shrink-0 rounded-lg p-2 text-zinc-400 transition-colors hover:bg-[var(--app-nav-hover-bg)] hover:text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--app-accent)]"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 md:px-6">
              <p className="text-sm leading-relaxed text-zinc-400">
                The API contract targets{" "}
                <code className="rounded bg-[var(--background)]/60 px-1.5 py-0.5 text-xs text-zinc-300">
                  ProjectAiBriefResponse
                </code>{" "}
                (<code className="text-xs text-zinc-400">narrative</code> +{" "}
                <code className="text-xs text-zinc-400">structured</code>). Planned
                structured sections:
              </p>
              <ul className="mt-4 space-y-4">
                {PLANNED_FIELDS.map((item) => (
                  <li
                    key={item.title}
                    className="rounded-xl border border-[var(--app-sidebar-border)]/80 bg-[var(--background)]/20 px-4 py-3"
                  >
                    <h3 className="text-sm font-semibold text-[var(--foreground)]">
                      {item.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-zinc-500">
                      {item.body}
                    </p>
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-xs leading-relaxed text-zinc-600">
                Reference:{" "}
                <code className="text-zinc-500">lib/projects/ai-brief-types.ts</code>
                , mock sample in{" "}
                <code className="text-zinc-500">lib/projects/ai-brief-mock.ts</code>
                , route{" "}
                <code className="text-zinc-500">POST /api/projects/ai-brief</code>{" "}
                (unused by this modal until the flow is reconnected).
              </p>
            </div>

            <div className="shrink-0 border-t border-[var(--app-sidebar-border)] px-5 py-4 md:px-6">
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={dismiss}
                  className={cn(
                    "rounded-lg px-4 py-2.5 text-sm font-semibold",
                    "text-[var(--background)]"
                  )}
                  style={{ background: "var(--app-accent)" }}
                >
                  Continue to project
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
