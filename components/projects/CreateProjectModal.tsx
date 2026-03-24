"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { FolderKanban, X } from "lucide-react";
import { MAX_PROJECTS_ON_WORKSPACE_LIST } from "@/lib/projects/constants";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { ProjectRoleTag, ProjectSummary } from "./project-types";

const ROLE_CYCLE: ProjectRoleTag[] = [
  "product_manager",
  "scrum_master",
  "team_developer",
];

const easeSmooth = [0.25, 0.1, 0.25, 1] as const;

const DOT_CLASSES = [
  "bg-emerald-500",
  "bg-amber-500",
  "bg-blue-500",
  "bg-violet-500",
] as const;

const inputClass =
  "mt-1.5 w-full rounded-lg border border-[var(--app-sidebar-border)] bg-[var(--background)]/50 px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-zinc-600 outline-none transition-[border-color,box-shadow] focus:border-[var(--app-accent)]/50 focus:ring-2 focus:ring-[var(--app-accent)]/25";

interface CreateProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectCreated?: (project: ProjectSummary) => void;
  existingProjectCount?: number;
  projectLimitReached?: boolean;
}

const emptyForm = { title: "", description: "" };

export function CreateProjectModal({
  open,
  onOpenChange,
  onProjectCreated,
  existingProjectCount = 0,
  projectLimitReached = false,
}: CreateProjectModalProps) {
  const titleId = useId();
  const formTitleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const mounted = typeof document !== "undefined";

  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setForm(emptyForm);
      setSaveError(null);
      return;
    }
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

  async function confirmProject() {
    console.log("CONFIRM CLICKED");
    if (projectLimitReached || saving) return;
    const project_name = form.title.trim();
    if (project_name.length < 2) return;
    const description = form.description.trim() || null;

    setSaving(true);
    setSaveError(null);

   try {
      const supabase = createClient();
      

      // Get the current logged-in user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      console.log("USER:", user);
      console.log("AUTH ERROR:", authError);

      if (authError || !user) {
        setSaveError("You must be logged in to create a project.");
        return;
      }
      
      // Insert into the projects table and return the generated UUID
      const { data, error: insertError } = await supabase
        .from("projects")
        .insert({ project_name, description, owner_id: user.id })
        .select("id")
        .single();

      if (insertError || !data) {
        console.error("Supabase insert error:", insertError?.message);
        setSaveError("Failed to create project. Please try again.");
        return;
      }

      // Build the local ProjectSummary using the real UUID from Supabase
      const project: ProjectSummary = {
        id: data.id,
        name: project_name,
        description: description ?? undefined,
        dotClass:
          DOT_CLASSES[existingProjectCount % DOT_CLASSES.length] ??
          "bg-emerald-500",
        updatedLabel: "Just now",
        roleTag: ROLE_CYCLE[existingProjectCount % ROLE_CYCLE.length],
        aiBriefEngagement: "pending",
      };

      onProjectCreated?.(project);
      onOpenChange(false);
    } catch (err) {
      console.error("Unexpected error:", err);
      setSaveError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const canCreate = form.title.trim().length >= 2;

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          key="create-project-layer"
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
            onClick={() => onOpenChange(false)}
          />
          <motion.div
            role="dialog"
            aria-modal
            aria-labelledby={titleId}
            className="relative z-10 flex max-h-[min(88vh,720px)] w-full max-w-xl flex-col rounded-t-2xl border border-[var(--app-sidebar-border)] bg-[var(--auth-card)] shadow-[0_-8px_40px_-12px_rgba(0,0,0,0.5)] sm:max-w-2xl sm:rounded-2xl sm:shadow-2xl"
            initial={{ opacity: 0, y: 48, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 28, scale: 0.98 }}
            transition={{ duration: 0.36, ease: easeSmooth }}
          >
            {/* Header */}
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[var(--app-sidebar-border)] px-5 py-4 md:px-6">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2
                    id={titleId}
                    className="text-lg font-semibold tracking-tight text-[var(--foreground)]"
                  >
                    New project
                  </h2>
                  <span className="rounded-md border border-[var(--app-accent)]/35 bg-[var(--app-nav-active-bg)] px-2 py-0.5 text-xs font-medium text-[var(--app-accent)]">
                    PM
                  </span>
                </div>
                <p className="mt-1 text-sm text-zinc-500">
                  Name your project and add a short description for the card.
                </p>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={() => onOpenChange(false)}
                className="shrink-0 rounded-lg p-2 text-zinc-400 transition-colors hover:bg-[var(--app-nav-hover-bg)] hover:text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--app-accent)]"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>

            {/* Body */}
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 md:px-6">
              {projectLimitReached ? (
                <div
                  className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-100/90"
                  role="status"
                >
                  <span className="font-medium text-amber-50">
                    Workspace full ({MAX_PROJECTS_ON_WORKSPACE_LIST}/
                    {MAX_PROJECTS_ON_WORKSPACE_LIST}).
                  </span>{" "}
                  Remove a project from the grid or sidebar to add another.
                </div>
              ) : null}

              {!projectLimitReached ? (
                <form
                  id="create-project-form"
                  className="space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (canCreate) confirmProject();
                  }}
                >
                  <div>
                    <label
                      htmlFor={formTitleId}
                      className="text-sm font-medium text-zinc-300"
                    >
                      Project title
                    </label>
                    <input
                      id={formTitleId}
                      type="text"
                      autoComplete="off"
                      value={form.title}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, title: e.target.value }))
                      }
                      placeholder="e.g. Customer onboarding 2.0"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-300">
                      Description{" "}
                      <span className="font-normal text-zinc-500">(optional)</span>
                    </label>
                    <textarea
                      value={form.description}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, description: e.target.value }))
                      }
                      placeholder="One line for the project card…"
                      rows={4}
                      className={cn(inputClass, "resize-y min-h-[100px]")}
                    />
                  </div>

                  {saveError ? (
                    <p className="text-sm text-red-400" role="alert">
                      {saveError}
                    </p>
                  ) : null}
                </form>
              ) : null}
            </div>

            {/* Footer */}
            <div className="shrink-0 border-t border-[var(--app-sidebar-border)] px-5 py-4 md:px-6">
              {!projectLimitReached ? (
                <div className="flex flex-col gap-3">
                  {!canCreate ? (
                    <p className="text-center text-xs text-zinc-500 sm:text-right">
                      Enter a{" "}
                      <strong className="font-medium text-zinc-400">title</strong>{" "}
                      (2+ characters) to create the project.
                    </p>
                  ) : null}
                  <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={() => onOpenChange(false)}
                      disabled={saving}
                      className="rounded-lg px-4 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-[var(--app-nav-hover-bg)] hover:text-[var(--foreground)] disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      form="create-project-form"
                      disabled={!canCreate || saving}
                      className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-45"
                      style={{
                        background: "var(--app-accent)",
                        color: "var(--background)",
                      }}
                    >
                      <FolderKanban className="h-4 w-4" aria-hidden />
                      {saving ? "Creating…" : "Create project"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    className="rounded-lg px-4 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-[var(--app-nav-hover-bg)] hover:text-[var(--foreground)]"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
