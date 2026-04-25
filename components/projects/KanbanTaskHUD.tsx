"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  X, User, Hash, AlertCircle, CheckCircle2,
  Clock, Circle, BookOpen, Minus, Plus,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { TaskCard, ProjectMember } from "./KanbanCard";

const easeSmooth = [0.25, 0.1, 0.25, 1] as const;

const PRIORITY_OPTIONS: { value: number; label: string; dot: string; text: string }[] = [
  { value: 0, label: "Low",      dot: "bg-zinc-600",   text: "text-zinc-400" },
  { value: 1, label: "Medium",   dot: "bg-sky-500",    text: "text-sky-400" },
  { value: 2, label: "High",     dot: "bg-amber-400",  text: "text-amber-400" },
  { value: 3, label: "Critical", dot: "bg-red-500",    text: "text-red-400" },
];

const STATUS_CONFIG: Record<string, { icon: React.ReactNode; color: string }> = {
  "To Do":       { icon: <Circle className="h-3.5 w-3.5" />,       color: "text-zinc-400" },
  "In Progress": { icon: <Clock className="h-3.5 w-3.5" />,        color: "text-sky-400" },
  "Done":        { icon: <CheckCircle2 className="h-3.5 w-3.5" />, color: "text-emerald-400" },
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
  const [selectedPriority, setSelectedPriority] = useState<number>(0);
  const [storyPoints, setStoryPoints] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Sync all fields when task changes
  useEffect(() => {
    setSelectedMemberId(task?.assigned_to ?? null);
    setSelectedPriority(task?.priority ?? 0);
    setStoryPoints(task?.story_points ?? null);
    setSaveError(null);
    setSaved(false);
  }, [task?.id]);

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

  const assigneeChanged = selectedMemberId !== (task?.assigned_to ?? null);
  const priorityChanged = selectedPriority !== (task?.priority ?? 0);
  const pointsChanged = storyPoints !== (task?.story_points ?? null);
  const hasChanges = assigneeChanged || priorityChanged || pointsChanged;

  async function handleSave() {
    if (!task || !hasChanges) return;
    setSaving(true);
    setSaveError(null);
    setSaved(false);

    try {
      const supabase = createClient();
      const errors: string[] = [];

      // Update task: assigned_to + priority
      if (assigneeChanged || priorityChanged) {
        const { error } = await supabase
          .from("tasks")
          .update({
            ...(assigneeChanged ? { assigned_to: selectedMemberId } : {}),
            ...(priorityChanged ? { priority: selectedPriority } : {}),
          })
          .eq("id", task.id);
        if (error) errors.push(`Task: ${error.message}`);
      }

      // Update story: story_points (writes to parent story)
      if (pointsChanged && task.story_id) {
        const { error } = await supabase
          .from("stories")
          .update({ story_points: storyPoints })
          .eq("id", task.story_id);
        if (error) errors.push(`Story points: ${error.message}`);
      }

      if (errors.length > 0) {
        setSaveError(errors.join(" · "));
        return;
      }

      setSaved(true);
      onTaskUpdated({
        ...task,
        assigned_to: selectedMemberId,
        priority: selectedPriority,
        story_points: storyPoints,
      });
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setSaveError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const statusConfig = STATUS_CONFIG[task?.status ?? "To Do"] ?? STATUS_CONFIG["To Do"];
  const assignee = members.find((m) => m.user_id === task?.assigned_to) ?? null;
  const selectedMember = members.find((m) => m.user_id === selectedMemberId) ?? null;

  // Footer hint text
  const changesSummary = (() => {
    if (!hasChanges) return "No changes";
    const parts: string[] = [];
    if (assigneeChanged)
      parts.push(selectedMember ? `Assign → ${selectedMember.full_name}` : "Remove assignee");
    if (priorityChanged)
      parts.push(`Priority → ${PRIORITY_OPTIONS[selectedPriority]?.label ?? selectedPriority}`);
    if (pointsChanged)
      parts.push(`Points → ${storyPoints ?? "none"}`);
    return parts.join(" · ");
  })();

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
                <div className="mt-1.5 flex flex-wrap items-center gap-3">
                  <span className={cn("flex items-center gap-1 text-xs font-medium", statusConfig.color)}>
                    {statusConfig.icon}
                    {task.status}
                  </span>
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
            <div className="flex max-h-[60vh] flex-col gap-5 overflow-y-auto px-5 py-5">

              {/* Parent story */}
              {task.story_title ? (
                <div className="flex items-center gap-2 rounded-lg border border-[var(--app-sidebar-border)] bg-[var(--background)]/30 px-3 py-2.5">
                  <BookOpen className="h-3.5 w-3.5 shrink-0 text-zinc-500" aria-hidden />
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-600">
                      Parent story
                    </p>
                    <p className="truncate text-xs font-medium text-zinc-300">
                      {task.story_title}
                    </p>
                  </div>
                </div>
              ) : null}

              {/* Description */}
              {task.description ? (
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Description
                  </p>
                  <p className="text-sm leading-relaxed text-zinc-300">{task.description}</p>
                </div>
              ) : null}

              {/* Priority picker */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Priority
                </p>
                <div className="grid grid-cols-4 gap-1.5">
                  {PRIORITY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setSelectedPriority(opt.value)}
                      className={cn(
                        "flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-semibold transition-all duration-150",
                        selectedPriority === opt.value
                          ? "border-[var(--app-accent)]/40 bg-[var(--app-accent)]/10 text-[var(--foreground)]"
                          : "border-[var(--app-sidebar-border)] bg-[var(--background)]/30 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
                      )}
                    >
                      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", opt.dot)} aria-hidden />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Story points */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Story Points
                  {task.story_title ? (
                    <span className="ml-1.5 font-normal normal-case text-zinc-600">
                      (shared with parent story)
                    </span>
                  ) : null}
                </p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setStoryPoints((p) => Math.max(0, (p ?? 0) - 1))}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--app-sidebar-border)] bg-[var(--background)]/40 text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200 disabled:opacity-40"
                    disabled={storyPoints === null || storyPoints <= 0}
                    aria-label="Decrease story points"
                  >
                    <Minus className="h-3.5 w-3.5" aria-hidden />
                  </button>

                  <div className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[var(--app-sidebar-border)] bg-[var(--background)]/40 px-3 py-2">
                    <Hash className="h-3.5 w-3.5 shrink-0 text-zinc-600" aria-hidden />
                    <span className="min-w-[2ch] text-center text-sm font-semibold text-[var(--foreground)]">
                      {storyPoints ?? "—"}
                    </span>
                    <span className="text-xs text-zinc-600">
                      {storyPoints === 1 ? "point" : "points"}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setStoryPoints((p) => (p ?? 0) + 1)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--app-sidebar-border)] bg-[var(--background)]/40 text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200"
                    aria-label="Increase story points"
                  >
                    <Plus className="h-3.5 w-3.5" aria-hidden />
                  </button>

                  {storyPoints !== null ? (
                    <button
                      type="button"
                      onClick={() => setStoryPoints(null)}
                      className="text-xs text-zinc-600 underline-offset-2 hover:text-zinc-400 hover:underline"
                    >
                      Clear
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setStoryPoints(0)}
                      className="text-xs text-zinc-600 underline-offset-2 hover:text-zinc-400 hover:underline"
                    >
                      Set
                    </button>
                  )}
                </div>
              </div>

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
                <p className="truncate text-xs text-zinc-600">{changesSummary}</p>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-[var(--app-nav-hover-bg)] hover:text-[var(--foreground)]"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={!hasChanges || saving}
                    className={cn(
                      "inline-flex min-w-[72px] items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-40",
                      saved ? "bg-emerald-500/20 text-emerald-400" : ""
                    )}
                    style={saved ? undefined : { background: "var(--app-accent)", color: "var(--background)" }}
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