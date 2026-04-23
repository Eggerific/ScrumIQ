"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X, User, Hash, AlertCircle, CheckCircle2, Clock, Circle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { TaskCard, ProjectMember } from "./KanbanCard";

const easeSmooth = [0.25, 0.1, 0.25, 1] as const;

const PRIORITY_CONFIG: Record<number, { label: string; color: string }> = {
  0: { label: "Low",      color: "text-zinc-400" },
  1: { label: "Medium",   color: "text-sky-400" },
  2: { label: "High",     color: "text-amber-400" },
  3: { label: "Critical", color: "text-red-400" },
};

const STATUS_CONFIG: Record<string, { icon: React.ReactNode; color: string }> = {
  "To Do":       { icon: <Circle className="h-3.5 w-3.5" />,        color: "text-zinc-400" },
  "In Progress": { icon: <Clock className="h-3.5 w-3.5" />,         color: "text-sky-400" },
  "Done":        { icon: <CheckCircle2 className="h-3.5 w-3.5" />,  color: "text-emerald-400" },
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface KanbanTaskHUDProps {
  task: TaskCard | null;
  members: ProjectMember[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskUpdated: (updated: TaskCard) => void;
}

export function KanbanTaskHUD({
  task,
  members,
  open,
  onOpenChange,
  onTaskUpdated,
}: KanbanTaskHUDProps) {
  const titleId = useId();
  const mounted = typeof document !== "undefined";
  const closeRef = useRef<HTMLButtonElement>(null);

  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Sync selected member when task changes
  useEffect(() => {
    setSelectedMemberId(task?.assigned_to ?? null);
    setSaveError(null);
    setSaved(false);
  }, [task?.id, task?.assigned_to]);

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
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  async function handleSaveAssignee() {
    if (!task) return;
    setSaving(true);
    setSaveError(null);
    setSaved(false);

    const supabase = createClient();
    const { error } = await supabase
      .from("tasks")
      .update({ assigned_to: selectedMemberId })
      .eq("id", task.id);

    setSaving(false);

    if (error) {
      console.error("Failed to update assignee:", error.message);
      setSaveError("Failed to save. Please try again.");
      return;
    }

    setSaved(true);
    onTaskUpdated({ ...task, assigned_to: selectedMemberId });
    setTimeout(() => setSaved(false), 2000);
  }

  const assigneeChanged = selectedMemberId !== (task?.assigned_to ?? null);
  const priority = PRIORITY_CONFIG[task?.priority ?? 0] ?? PRIORITY_CONFIG[0];
  const statusConfig = STATUS_CONFIG[task?.status ?? "To Do"] ?? STATUS_CONFIG["To Do"];
  const assignee = members.find((m) => m.user_id === task?.assigned_to) ?? null;
  const selectedMember = members.find((m) => m.user_id === selectedMemberId) ?? null;

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && task ? (
        <motion.div
          key="task-hud-layer"
          className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: easeSmooth }}
        >
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0 border-0 bg-black/60 backdrop-blur-[2px]"
            onClick={() => onOpenChange(false)}
          />

          <motion.div
            role="dialog"
            aria-modal
            aria-labelledby={titleId}
            className="relative z-10 flex w-full max-w-lg flex-col rounded-t-2xl border border-[var(--app-sidebar-border)] bg-[var(--auth-card)] shadow-2xl sm:rounded-2xl"
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.32, ease: easeSmooth }}
          >
            {/* Header */}
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[var(--app-sidebar-border)] px-5 py-4">
              <div className="min-w-0 flex-1">
                <h2
                  id={titleId}
                  className="text-base font-semibold leading-snug text-[var(--foreground)]"
                >
                  {task.title}
                </h2>
                {/* Status + priority row */}
                <div className="mt-1.5 flex flex-wrap items-center gap-3">
                  <span className={cn("flex items-center gap-1 text-xs font-medium", statusConfig.color)}>
                    {statusConfig.icon}
                    {task.status}
                  </span>
                  <span className={cn("text-xs font-medium", priority.color)}>
                    {priority.label} priority
                  </span>
                  {task.story_points !== null ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-zinc-500">
                      <Hash className="h-3 w-3" aria-hidden />
                      {task.story_points} story {task.story_points === 1 ? "point" : "points"}
                    </span>
                  ) : null}
                </div>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={() => onOpenChange(false)}
                className="shrink-0 rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-[var(--app-nav-hover-bg)] hover:text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--app-accent)]"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>

            {/* Body */}
            <div className="flex flex-col gap-5 overflow-y-auto px-5 py-5">
              {/* Description */}
              {task.description ? (
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Description
                  </p>
                  <p className="text-sm leading-relaxed text-zinc-300">
                    {task.description}
                  </p>
                </div>
              ) : null}

              {/* Current assignee */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Current Assignee
                </p>
                {assignee ? (
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--app-accent)]/20 text-xs font-bold text-[var(--app-accent)] ring-1 ring-[var(--app-accent)]/30">
                      {getInitials(assignee.full_name)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--foreground)]">{assignee.full_name}</p>
                      <p className="text-xs text-zinc-500">{assignee.email}</p>
                    </div>
                  </div>
                ) : (
                  <p className="flex items-center gap-1.5 text-sm text-zinc-600">
                    <User className="h-4 w-4" aria-hidden />
                    Unassigned
                  </p>
                )}
              </div>

              {/* Reassign */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Reassign To
                </p>
                <div className="flex flex-col gap-1.5 rounded-xl border border-[var(--app-sidebar-border)] bg-[var(--background)]/40 p-1.5">
                  {/* Unassigned option */}
                  <button
                    type="button"
                    onClick={() => setSelectedMemberId(null)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                      selectedMemberId === null
                        ? "bg-[var(--app-accent)]/10 text-[var(--foreground)]"
                        : "text-zinc-500 hover:bg-[var(--app-nav-hover-bg)] hover:text-zinc-300"
                    )}
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-dashed border-zinc-700">
                      <User className="h-3.5 w-3.5" aria-hidden />
                    </div>
                    <span>Unassigned</span>
                    {selectedMemberId === null ? (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[var(--app-accent)]" aria-hidden />
                    ) : null}
                  </button>

                  {/* Member options */}
                  {members.map((member) => (
                    <button
                      key={member.user_id}
                      type="button"
                      onClick={() => setSelectedMemberId(member.user_id)}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                        selectedMemberId === member.user_id
                          ? "bg-[var(--app-accent)]/10 text-[var(--foreground)]"
                          : "text-zinc-400 hover:bg-[var(--app-nav-hover-bg)] hover:text-[var(--foreground)]"
                      )}
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--app-accent)]/15 text-[10px] font-bold text-[var(--app-accent)]">
                        {getInitials(member.full_name)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{member.full_name}</p>
                        <p className="truncate text-xs text-zinc-500">{member.email}</p>
                      </div>
                      {selectedMemberId === member.user_id ? (
                        <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--app-accent)]" aria-hidden />
                      ) : null}
                    </button>
                  ))}
                </div>
              </div>

              {saveError ? (
                <p className="flex items-center gap-1.5 text-sm text-red-400" role="alert">
                  <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
                  {saveError}
                </p>
              ) : null}
            </div>

            {/* Footer */}
            <div className="shrink-0 border-t border-[var(--app-sidebar-border)] px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-zinc-600">
                  {selectedMember
                    ? `Will assign to ${selectedMember.full_name}`
                    : assigneeChanged
                    ? "Will remove assignee"
                    : "No changes"}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-[var(--app-nav-hover-bg)] hover:text-[var(--foreground)]"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveAssignee}
                    disabled={!assigneeChanged || saving}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-40",
                      saved
                        ? "bg-emerald-500/20 text-emerald-400"
                        : ""
                    )}
                    style={
                      saved
                        ? undefined
                        : { background: "var(--app-accent)", color: "var(--background)" }
                    }
                  >
                    {saving ? "Saving…" : saved ? "Saved ✓" : "Save"}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
