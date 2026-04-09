"use client";

import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Info, X } from "lucide-react";
import { BacklogPersistLoadingState } from "@/components/projects/ai-flow/BacklogPersistLoadingState";
import { cn } from "@/lib/utils";

const easeSmooth = [0.25, 0.1, 0.25, 1] as const;

export interface AiBacklogConfirmModalProps {
  open: boolean;
  onCancel: () => void;
  /** May be async; parent can show `isPending` until it resolves. */
  onConfirm: () => void | Promise<void>;
  isPending?: boolean;
  errorMessage?: string | null;
  /** Shown on the long-running save experience after confirm. */
  projectName?: string;
}

/**
 * Confirm before leaving AI Generation — user can’t reopen this flow, but may edit on backlog.
 * Pattern aligned with {@link AiGenerateConfirmModal}.
 */
export function AiBacklogConfirmModal({
  open,
  onCancel,
  onConfirm,
  isPending = false,
  errorMessage = null,
  projectName,
}: AiBacklogConfirmModalProps) {
  const titleId = useId();
  const descId = useId();
  const persistDescId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const mounted = typeof document !== "undefined";

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => cancelRef.current?.focus(), 50);
    return () => {
      document.body.style.overflow = prev;
      window.clearTimeout(t);
    };
  }, [open]);

  useEffect(() => {
    if (!open || isPending) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onCancel, isPending]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          key="ai-backlog-confirm"
          className="fixed inset-0 z-[101] flex items-end justify-center sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: easeSmooth }}
        >
          <button
            type="button"
            aria-label="Close dialog"
            className="absolute inset-0 border-0 bg-black/55 backdrop-blur-[2px]"
            onClick={() => {
              if (!isPending) onCancel();
            }}
          />
          <motion.div
            layout
            role="alertdialog"
            aria-modal
            aria-labelledby={titleId}
            aria-describedby={isPending ? persistDescId : descId}
            className={cn(
              "relative z-10 w-full rounded-t-2xl border border-[var(--app-sidebar-border)] bg-[var(--auth-card)] shadow-[0_-8px_40px_-12px_rgba(0,0,0,0.5)] sm:rounded-2xl sm:shadow-2xl",
              isPending ? "max-w-2xl" : "max-w-md"
            )}
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.3, ease: easeSmooth }}
          >
            {isPending ? (
              <>
                <div className="border-b border-[var(--app-sidebar-border)] px-5 py-4 md:px-6">
                  <h2
                    id={titleId}
                    className="text-lg font-semibold tracking-tight text-[var(--foreground)]"
                  >
                    Saving your backlog
                  </h2>
                  <p
                    id={persistDescId}
                    className="mt-1.5 text-sm leading-relaxed text-zinc-500"
                  >
                    We&apos;re persisting this draft to your project. This can
                    take a while on slow networks or large backlogs — keep this
                    tab open until we finish.
                  </p>
                </div>
                <BacklogPersistLoadingState
                  projectName={projectName}
                  className="px-3 pb-6 pt-2 md:px-5"
                />
              </>
            ) : (
              <>
                <div className="flex items-start justify-between gap-3 border-b border-[var(--app-sidebar-border)] px-5 py-4">
                  <div className="flex min-w-0 gap-3">
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--app-accent)]/30 bg-[var(--app-accent)]/10 text-[var(--app-accent)]"
                      aria-hidden
                    >
                      <Info className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <h2
                        id={titleId}
                        className="text-lg font-semibold tracking-tight text-[var(--foreground)]"
                      >
                        Add to backlog?
                      </h2>
                      <p
                        id={descId}
                        className="mt-2 text-sm leading-relaxed text-zinc-500"
                      >
                        You won&apos;t be able to open this AI Generation flow
                        again for this project. Finish editing on the review step
                        first, then confirm — you can keep refining on the Backlog
                        tab using the + next to each field.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!isPending) onCancel();
                    }}
                    disabled={isPending}
                    className="shrink-0 rounded-lg p-2 text-zinc-400 transition-colors hover:bg-[var(--app-nav-hover-bg)] hover:text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--app-accent)]/50 disabled:opacity-50"
                    aria-label="Cancel"
                  >
                    <X className="h-5 w-5" aria-hidden />
                  </button>
                </div>
                {errorMessage ? (
                  <p
                    role="alert"
                    className="border-t border-[var(--app-sidebar-border)] px-5 py-3 text-sm text-red-300"
                  >
                    {errorMessage}
                  </p>
                ) : null}
                <div className="flex flex-col-reverse gap-2 px-5 py-4 sm:flex-row sm:justify-end">
                  <button
                    ref={cancelRef}
                    type="button"
                    onClick={onCancel}
                    disabled={isPending}
                    className="rounded-lg px-4 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-[var(--app-nav-hover-bg)] hover:text-[var(--foreground)] disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void onConfirm()}
                    disabled={isPending}
                    className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-[var(--background)] transition-opacity hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-[var(--app-accent)]/45 disabled:cursor-not-allowed disabled:opacity-70"
                    style={{ background: "var(--app-accent)" }}
                  >
                    Add to backlog
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
