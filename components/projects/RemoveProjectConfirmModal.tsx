"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProjectSummary } from "./project-types";

const easeSmooth = [0.25, 0.1, 0.25, 1] as const;

interface RemoveProjectConfirmModalProps {
  project: ProjectSummary | null;
  onCancel: () => void;
  onConfirm: (project: ProjectSummary) => void | Promise<void>;
}

export function RemoveProjectConfirmModal({
  project,
  onCancel,
  onConfirm,
}: RemoveProjectConfirmModalProps) {
  const titleId = useId();
  const descId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [removing, setRemoving] = useState(false);
  const mounted = typeof document !== "undefined";
  const open = project !== null;

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

  useEffect(() => {
    if (!open) setRemoving(false);
  }, [open]);

  async function handleRemoveClick() {
    if (!project || removing) return;
    setRemoving(true);
    try {
      await onConfirm(project);
    } finally {
      setRemoving(false);
    }
  }

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && project ? (
        <motion.div
          key="remove-project-layer"
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
              <div className="min-w-0">
                <h2
                  id={titleId}
                  className="text-lg font-semibold tracking-tight text-[var(--foreground)]"
                >
                  Remove project?
                </h2>
                <p
                  id={descId}
                  className="mt-2 text-sm leading-relaxed text-zinc-500"
                >
                  <span className="font-medium text-zinc-400">
                    &ldquo;{project.name}&rdquo;
                  </span>{" "}
                  will be removed from this workspace. You can add another
                  project afterward if you have room.
                </p>
              </div>
              <button
                type="button"
                onClick={onCancel}
                className="shrink-0 rounded-lg p-2 text-zinc-400 transition-colors hover:bg-[var(--app-nav-hover-bg)] hover:text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--app-accent)]"
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
                disabled={removing}
                className="rounded-lg px-4 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-[var(--app-nav-hover-bg)] hover:text-[var(--foreground)] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleRemoveClick()}
                disabled={removing}
                className={cn(
                  "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold",
                  "border border-red-500/35 bg-red-500/15 text-red-200 transition-colors",
                  "hover:bg-red-500/25 hover:text-red-100 focus:outline-none focus:ring-2 focus:ring-red-500/30",
                  "disabled:cursor-not-allowed disabled:opacity-50"
                )}
              >
                <Trash2 className="h-4 w-4 shrink-0" aria-hidden />
                {removing ? "Removing…" : "Remove"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
