"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { UserPlus, X, Search, ChevronDown, Loader2, UserCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { checkInviteeProjectCapacity } from "@/lib/projects/invite-capacity-check";
import { MAX_PROJECTS_ON_WORKSPACE_LIST } from "@/lib/projects/constants";

const easeSmooth = [0.25, 0.1, 0.25, 1] as const;

type MemberRole = "product_manager" | "scrum_master" | "team_developer";

const ROLE_OPTIONS: { value: MemberRole; label: string }[] = [
  { value: "product_manager", label: "Product Manager" },
  { value: "scrum_master", label: "SCRUM Master" },
  { value: "team_developer", label: "Developer" },
];

interface UserResult {
  id: string;
  full_name: string;
  email: string;
}

interface InviteMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectName: string;
}

export function InviteMemberModal({
  open,
  onOpenChange,
  projectId,
  projectName,
}: InviteMemberModalProps) {
  const titleId = useId();
  const searchId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const mounted = typeof document !== "undefined";

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [selected, setSelected] = useState<UserResult | null>(null);
  const [role, setRole] = useState<MemberRole>("team_developer");
  const [searching, setSearching] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [capacityLoading, setCapacityLoading] = useState(false);
  const [capacityBlocked, setCapacityBlocked] = useState(false);

  // Reset all state when modal closes
  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      setSelected(null);
      setRole("team_developer");
      setSearching(false);
      setInviting(false);
      setSuccess(false);
      setError(null);
      setCapacityLoading(false);
      setCapacityBlocked(false);
      return;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => searchRef.current?.focus(), 50);
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

  useEffect(() => {
    if (!open || !selected) {
      setCapacityLoading(false);
      setCapacityBlocked(false);
      return;
    }
    let cancelled = false;
    setCapacityLoading(true);
    setCapacityBlocked(false);
    setError(null);
    const supabase = createClient();
    void checkInviteeProjectCapacity(supabase, selected.id, projectId).then(
      (result) => {
        if (cancelled) return;
        setCapacityLoading(false);
        if (result.allowed) {
          setCapacityBlocked(false);
          return;
        }
        if (result.code === "at_project_limit") {
          setCapacityBlocked(true);
          return;
        }
        setCapacityBlocked(false);
        setError(result.message);
      }
    );
    return () => {
      cancelled = true;
    };
  }, [open, selected, projectId]);

  // Debounced search against the users table
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setSearching(true);
      setError(null);

      try {
        const supabase = createClient();

        // Get current user so we can exclude them from results
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();

        // Search users by full_name (case-insensitive)
        const { data, error: searchError } = await supabase
          .from("users")
          .select("id, full_name, email")
          .ilike("full_name", `%${query.trim()}%`)
          .neq("id", currentUser?.id ?? "")
          .limit(6);

        if (searchError) {
          setError("Search failed. Please try again.");
          setResults([]);
        } else {
          // Filter out users already in this project
          const { data: existing } = await supabase
            .from("project_members")
            .select("user_id")
            .eq("project_id", projectId);

          const existingIds = new Set((existing ?? []).map((m) => m.user_id));
          setResults(
            (data ?? []).filter((u) => !existingIds.has(u.id))
          );
        }
      } catch {
        setError("Something went wrong. Please try again.");
      } finally {
        setSearching(false);
      }
    }, 350);

    return () => clearTimeout(timeout);
  }, [query, projectId]);

  async function confirmInvite() {
    if (!selected || inviting) return;

    setInviting(true);
    setError(null);

    try {
      const supabase = createClient();

      // Double-check they're not already a member
      const { data: existing } = await supabase
        .from("project_members")
        .select("id")
        .eq("project_id", projectId)
        .eq("user_id", selected.id)
        .maybeSingle();

      if (existing) {
        setError(`${selected.full_name} is already a member of this project.`);
        setInviting(false);
        return;
      }

      const capacity = await checkInviteeProjectCapacity(
        supabase,
        selected.id,
        projectId
      );
      if (!capacity.allowed) {
        setError(capacity.message);
        setCapacityBlocked(capacity.code === "at_project_limit");
        setInviting(false);
        return;
      }

      const { error: insertError } = await supabase
        .from("project_members")
        .insert({
          project_id: projectId,
          user_id: selected.id,
          role,
        });

      if (insertError) {
        console.error("Insert error:", insertError.message);
        if (
          insertError.message.includes("project_member_limit") ||
          insertError.code === "P0001"
        ) {
          setError(
            `This person already has the maximum of ${MAX_PROJECTS_ON_WORKSPACE_LIST} active projects. They need to leave another project before joining this one.`
          );
          setCapacityBlocked(true);
        } else {
          setError("Failed to add member. Please try again.");
        }
        return;
      }

      setSuccess(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setInviting(false);
    }
  }

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          key="invite-member-layer"
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
            className="relative z-10 flex w-full max-w-lg flex-col rounded-t-2xl border border-[var(--app-sidebar-border)] bg-[var(--auth-card)] shadow-[0_-8px_40px_-12px_rgba(0,0,0,0.5)] sm:rounded-2xl sm:shadow-2xl"
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
                    Invite member
                  </h2>
                  <span className="rounded-md border border-[var(--app-accent)]/35 bg-[var(--app-nav-active-bg)] px-2 py-0.5 text-xs font-medium text-[var(--app-accent)]">
                    {projectName}
                  </span>
                </div>
                <p className="mt-1 text-sm text-zinc-500">
                  Search by name to add someone to this project.
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
            <div className="px-5 py-5 md:px-6">
              {success ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.28, ease: easeSmooth }}
                  className="flex flex-col items-center gap-3 py-6 text-center"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/15">
                    <UserCheck className="h-7 w-7 text-emerald-400" aria-hidden />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-[var(--foreground)]">
                      {selected?.full_name} added!
                    </p>
                    <p className="mt-1 text-sm text-zinc-500">
                      They now have access to{" "}
                      <span className="text-zinc-300">{projectName}</span>.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSuccess(false);
                      setSelected(null);
                      setQuery("");
                      setResults([]);
                      setRole("team_developer");
                      setTimeout(() => searchRef.current?.focus(), 50);
                    }}
                    className="mt-2 rounded-lg border border-[var(--app-sidebar-border)] px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-[var(--app-nav-hover-bg)]"
                  >
                    Invite another
                  </button>
                </motion.div>
              ) : (
                <div className="space-y-4">
                  {/* Search input */}
                  <div className="relative">
                    <label
                      htmlFor={searchId}
                      className="text-sm font-medium text-zinc-300"
                    >
                      Search by name
                    </label>
                    <div className="relative mt-1.5">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" aria-hidden />
                      {searching ? (
                        <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-zinc-500" aria-hidden />
                      ) : null}
                      <input
                        ref={searchRef}
                        id={searchId}
                        type="text"
                        autoComplete="off"
                        value={query}
                        onChange={(e) => {
                          setQuery(e.target.value);
                          setSelected(null);
                          setError(null);
                        }}
                        placeholder="e.g. Jack McGowan"
                        className="w-full rounded-lg border border-[var(--app-sidebar-border)] bg-[var(--background)]/50 py-2 pl-9 pr-9 text-sm text-[var(--foreground)] placeholder:text-zinc-600 outline-none transition-[border-color,box-shadow] focus:border-[var(--app-accent)]/50 focus:ring-2 focus:ring-[var(--app-accent)]/25"
                      />
                    </div>
                  </div>

                  {/* Search results */}
                  <AnimatePresence mode="wait">
                    {results.length > 0 && !selected ? (
                      <motion.ul
                        key="results"
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.2, ease: easeSmooth }}
                        className="overflow-hidden rounded-lg border border-[var(--app-sidebar-border)] bg-[var(--background)]/60"
                        role="listbox"
                        aria-label="Search results"
                      >
                        {results.map((user) => (
                          <li key={user.id} role="option" aria-selected={false}>
                            <button
                              type="button"
                              onClick={() => setSelected(user)}
                              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--app-nav-hover-bg)]"
                            >
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--app-accent)]/20 text-xs font-semibold text-[var(--app-accent)]">
                                {user.full_name.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-[var(--foreground)]">
                                  {user.full_name}
                                </p>
                                <p className="truncate text-xs text-zinc-500">
                                  {user.email}
                                </p>
                              </div>
                            </button>
                          </li>
                        ))}
                      </motion.ul>
                    ) : query.trim().length >= 2 && !searching && results.length === 0 ? (
                      <motion.p
                        key="no-results"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-center text-sm text-zinc-500 py-2"
                      >
                        No users found matching{" "}
                        <span className="text-zinc-300">
                          {`\u201c${query}\u201d`}
                        </span>{" "}
                        — or they are already a member.
                      </motion.p>
                    ) : null}
                  </AnimatePresence>

                  {/* Selected user confirmation */}
                  <AnimatePresence>
                    {selected ? (
                      <motion.div
                        key="selected"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        transition={{ duration: 0.22, ease: easeSmooth }}
                        className="flex items-center gap-3 rounded-lg border border-[var(--app-accent)]/30 bg-[var(--app-accent)]/8 px-4 py-3"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--app-accent)]/25 text-sm font-semibold text-[var(--app-accent)]">
                          {selected.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-[var(--foreground)]">
                            {selected.full_name}
                          </p>
                          <p className="truncate text-xs text-zinc-500">
                            {selected.email}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelected(null);
                            setTimeout(() => searchRef.current?.focus(), 50);
                          }}
                          className="shrink-0 rounded p-1 text-zinc-500 hover:text-zinc-300"
                          aria-label="Deselect user"
                        >
                          <X className="h-4 w-4" aria-hidden />
                        </button>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>

                  {/* Role dropdown — shown once a user is selected */}
                  <AnimatePresence>
                    {selected ? (
                      <motion.div
                        key="role-select"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        transition={{ duration: 0.22, ease: easeSmooth }}
                      >
                        <label className="text-sm font-medium text-zinc-300">
                          Assign role
                        </label>
                        <div className="relative mt-1.5">
                          <select
                            value={role}
                            onChange={(e) => setRole(e.target.value as MemberRole)}
                            className="w-full appearance-none rounded-lg border border-[var(--app-sidebar-border)] bg-[var(--background)]/50 px-3 py-2 pr-9 text-sm text-[var(--foreground)] outline-none transition-[border-color,box-shadow] focus:border-[var(--app-accent)]/50 focus:ring-2 focus:ring-[var(--app-accent)]/25"
                          >
                            {ROLE_OPTIONS.map((o) => (
                              <option key={o.value} value={o.value}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" aria-hidden />
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>

                  {selected && capacityBlocked ? (
                    <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-100/90">
                      <span className="font-medium">{selected.full_name}</span>{" "}
                      already has the maximum of{" "}
                      {MAX_PROJECTS_ON_WORKSPACE_LIST} active projects. They
                      need to leave another project before they can join this
                      one.
                    </p>
                  ) : null}

                  {error ? (
                    <p className="text-sm text-red-400" role="alert">
                      {error}
                    </p>
                  ) : null}
                </div>
              )}
            </div>

            {/* Footer */}
            {!success ? (
              <div className="shrink-0 border-t border-[var(--app-sidebar-border)] px-5 py-4 md:px-6">
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    disabled={inviting}
                    className="rounded-lg px-4 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-[var(--app-nav-hover-bg)] hover:text-[var(--foreground)] disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={confirmInvite}
                    disabled={
                      !selected ||
                      inviting ||
                      capacityLoading ||
                      capacityBlocked
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-45"
                    style={{
                      background: "var(--app-accent)",
                      color: "var(--background)",
                    }}
                  >
                    {inviting || capacityLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    ) : (
                      <UserPlus className="h-4 w-4" aria-hidden />
                    )}
                    {inviting
                      ? "Adding…"
                      : capacityLoading
                        ? "Checking…"
                        : "Add to project"}
                  </button>
                </div>
              </div>
            ) : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
