"use client";

import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";

const easeSmooth = [0.25, 0.1, 0.25, 1] as const;

export interface AiGenerateConfirmModalProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * Warning before AI backlog generation — replaces browser confirm.
 * Pattern aligned with {@link RemoveProjectConfirmModal}.
 */
export function AiGenerateConfirmModal({
  open,
  onCancel,
  onConfirm,
}: AiGenerateConfirmModalProps) {
  const titleId = useId();
  const descId = useId();
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
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          key="ai-generate-confirm"
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
            onClick={onCancel}
          />
          <motion.div
            role="alertdialog"
            aria-modal
            aria-labelledby={titleId}
            aria-describedby={descId}
            className="relative z-10 w-full max-w-md rounded-t-2xl border border-[var(--app-sidebar-border)] bg-[var(--auth-card)] shadow-[0_-8px_40px_-12px_rgba(0,0,0,0.5)] sm:rounded-2xl sm:shadow-2xl"
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.3, ease: easeSmooth }}
          >
            <div className="flex items-start justify-between gap-3 border-b border-[var(--app-sidebar-border)] px-5 py-4">
              <div className="flex min-w-0 gap-3">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-500/35 bg-amber-500/10 text-amber-400"
                  aria-hidden
                >
                  <AlertTriangle className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <h2
                    id={titleId}
                    className="text-lg font-semibold tracking-tight text-[var(--foreground)]"
                  >
                    Generate from this context?
                  </h2>
                  <p
                    id={descId}
                    className="mt-2 text-sm leading-relaxed text-zinc-500"
                  >
                    This uses your project context and credits. After generation
                    you can&apos;t change these inputs—only edit the backlog
                    items on the next step.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onCancel}
                className="shrink-0 rounded-lg p-2 text-zinc-400 transition-colors hover:bg-[var(--app-nav-hover-bg)] hover:text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--app-accent)]/50"
                aria-label="Cancel"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <div className="flex flex-col-reverse gap-2 px-5 py-4 sm:flex-row sm:justify-end">
              <button
                ref={cancelRef}
                type="button"
                onClick={onCancel}
                className="rounded-lg px-4 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-[var(--app-nav-hover-bg)] hover:text-[var(--foreground)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="rounded-lg px-4 py-2.5 text-sm font-semibold text-[var(--background)] transition-opacity hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-[var(--app-accent)]/45"
                style={{ background: "var(--app-accent)" }}
              >
                Generate
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
