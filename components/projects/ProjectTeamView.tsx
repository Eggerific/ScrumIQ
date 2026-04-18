"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, Shield, UserPlus, UserMinus, Users } from "lucide-react";
import { PageShell } from "@/components/app/PageShell";
import { createClient } from "@/lib/supabase/client";
import { AppSelect } from "@/components/ui/AppSelect";
import {
  InviteMemberModal,
  type InviteAddedMemberPayload,
} from "./InviteMemberModal";
import { useProjectsWorkspace } from "./ProjectsWorkspaceProvider";
import {
  PROJECT_ROLE_LABELS,
  canInviteProjectMembers,
  type ProjectRoleTag,
} from "./project-types";

const ROLE_SELECT_OPTIONS: { value: ProjectRoleTag; label: string }[] = [
  { value: "product_manager", label: PROJECT_ROLE_LABELS.product_manager },
  { value: "scrum_master", label: PROJECT_ROLE_LABELS.scrum_master },
  { value: "team_developer", label: PROJECT_ROLE_LABELS.team_developer },
];

type TeamMember = {
  userId: string;
  fullName: string;
  email: string;
  role: ProjectRoleTag | "unknown";
  isOwner: boolean;
};

function isProjectRoleTag(r: string): r is ProjectRoleTag {
  return (
    r === "product_manager" ||
    r === "scrum_master" ||
    r === "team_developer"
  );
}

function roleLabel(role: TeamMember["role"]): string {
  if (role === "unknown") return "Member";
  return PROJECT_ROLE_LABELS[role];
}

function sortTeamMembers(a: TeamMember, b: TeamMember): number {
  if (a.isOwner !== b.isOwner) return a.isOwner ? -1 : 1;
  const order: Record<ProjectRoleTag, number> = {
    product_manager: 0,
    scrum_master: 1,
    team_developer: 2,
  };
  const ra = a.role !== "unknown" ? order[a.role] ?? 99 : 99;
  const rb = b.role !== "unknown" ? order[b.role] ?? 99 : 99;
  if (ra !== rb) return ra - rb;
  return a.fullName.localeCompare(b.fullName, undefined, {
    sensitivity: "base",
  });
}

function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function mergeMemberIntoRoster(
  prev: TeamMember[],
  added: InviteAddedMemberPayload
): TeamMember[] {
  const next = prev.filter((m) => m.userId !== added.userId);
  next.push({
    userId: added.userId,
    fullName: added.fullName,
    email: added.email,
    role: added.role,
    isOwner: false,
  });
  return next.sort(sortTeamMembers);
}

export function ProjectTeamView({ projectId }: { projectId: string }) {
  const router = useRouter();
  const { projects, projectsHydrated, refreshProjects } =
    useProjectsWorkspace();
  const project = projects.find((p) => p.id === projectId);
  const canManageTeam = canInviteProjectMembers(project?.roleTag);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [recentlyAddedUserId, setRecentlyAddedUserId] = useState<
    string | null
  >(null);
  const [roleSavingUserId, setRoleSavingUserId] = useState<string | null>(null);
  const [roleSaveError, setRoleSaveError] = useState<string | null>(null);
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);
  const [removeConfirmUserId, setRemoveConfirmUserId] = useState<string | null>(
    null
  );
  const [removeError, setRemoveError] = useState<string | null>(null);

  const loadRoster = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!projectId) return;
      const silent = opts?.silent === true;
      if (!silent) {
        setLoading(true);
      }
      if (!silent) {
        setLoadError(null);
      }
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setCurrentUserId(user?.id ?? null);

        const { data: proj, error: projError } = await supabase
          .from("projects")
          .select("owner_id")
          .eq("id", projectId)
          .maybeSingle();

        if (projError || !proj) {
          if (!silent) {
            setLoadError("Could not load project.");
            setMembers([]);
          }
          return;
        }

        const ownerId = proj.owner_id as string;

        const { data: rows, error: memError } = await supabase
          .from("project_members")
          .select("user_id, role")
          .eq("project_id", projectId);

        if (memError) {
          if (!silent) {
            setLoadError("Could not load team members.");
            setMembers([]);
          }
          return;
        }

        const memberList = rows ?? [];
        const ids = memberList.map((m) => m.user_id as string).filter(Boolean);

        if (ids.length === 0) {
          setMembers([]);
          return;
        }

        const { data: profiles, error: profError } = await supabase
          .from("users")
          .select("id, full_name, email")
          .in("id", ids);

        if (profError) {
          if (!silent) {
            setLoadError("Could not load profiles for team members.");
            setMembers([]);
          }
          return;
        }

        const byId = new Map(
          (profiles ?? []).map((p) => [
            p.id as string,
            {
              fullName: (p.full_name as string) || "Unknown",
              email: (p.email as string) || "",
            },
          ])
        );

        const merged: TeamMember[] = memberList.map((m) => {
          const uid = m.user_id as string;
          const prof = byId.get(uid);
          const rawRole = typeof m.role === "string" ? m.role : "";
          return {
            userId: uid,
            fullName: prof?.fullName ?? "Unknown",
            email: prof?.email ?? "",
            role: isProjectRoleTag(rawRole) ? rawRole : "unknown",
            isOwner: uid === ownerId,
          };
        });

        setMembers(merged.sort(sortTeamMembers));
      } catch {
        if (!silent) {
          setLoadError("Something went wrong while loading the team.");
          setMembers([]);
        }
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [projectId]
  );

  useEffect(() => {
    if (!projectsHydrated || !project) return;
    void loadRoster();
  }, [projectsHydrated, project, loadRoster]);

  useEffect(() => {
    if (!recentlyAddedUserId) return;
    const t = window.setTimeout(() => setRecentlyAddedUserId(null), 2600);
    return () => window.clearTimeout(t);
  }, [recentlyAddedUserId]);

  const handleInviteSuccess = useCallback((added: InviteAddedMemberPayload) => {
    setRecentlyAddedUserId(added.userId);
    setMembers((prev) => mergeMemberIntoRoster(prev, added));
    void loadRoster({ silent: true });
  }, [loadRoster]);

  async function handleRoleChange(member: TeamMember, nextRole: ProjectRoleTag) {
    if (!canManageTeam || member.isOwner || member.role === nextRole) return;
    if (member.role === "unknown") return;

    setRoleSaveError(null);
    setRoleSavingUserId(member.userId);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("project_members")
        .update({ role: nextRole })
        .eq("project_id", projectId)
        .eq("user_id", member.userId);

      if (error) {
        setRoleSaveError(
          error.message || "Could not update role. Check your permissions."
        );
        return;
      }

      setMembers((prev) =>
        prev
          .map((m) =>
            m.userId === member.userId ? { ...m, role: nextRole } : m
          )
          .sort(sortTeamMembers)
      );
    } finally {
      setRoleSavingUserId(null);
    }
  }

  async function handleConfirmRemove(member: TeamMember) {
    if (!canManageTeam || member.isOwner) return;

    setRemoveError(null);
    setRemovingUserId(member.userId);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("project_members")
        .delete()
        .eq("project_id", projectId)
        .eq("user_id", member.userId);

      if (error) {
        setRemoveError(
          error.message || "Could not remove member. Check your permissions."
        );
        return;
      }

      setRemoveConfirmUserId(null);
      setMembers((prev) => prev.filter((m) => m.userId !== member.userId));

      if (member.userId === currentUserId) {
        await refreshProjects();
        router.push("/projects");
        router.refresh();
      }
    } finally {
      setRemovingUserId(null);
    }
  }

  if (!projectsHydrated) {
    return (
      <PageShell title="Team" subtitle="Loading workspace…">
        <p className="text-sm text-zinc-500">Loading project…</p>
      </PageShell>
    );
  }

  if (!project) {
    return (
      <PageShell
        title="Project not found"
        subtitle="It may have been removed or this link is outdated."
      >
        <button
          type="button"
          onClick={() => router.push("/projects")}
          className="rounded-lg border border-[var(--app-sidebar-border)] px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-[var(--app-nav-hover-bg)]"
        >
          Back to projects
        </button>
      </PageShell>
    );
  }

  const subtitle = canManageTeam
    ? "Product Managers and Scrum Masters can invite teammates, change roles, and remove people from this project. The project owner cannot be removed."
    : "Everyone on this project can open shared workspace areas from the sidebar. Ask a Product Manager or Scrum Master to change membership.";

  const showInitialSpinner = loading && members.length === 0 && !loadError;
  const showEmptyState = !loading && members.length === 0 && !loadError;

  const roleSelectOptions = ROLE_SELECT_OPTIONS.map((o) => ({
    value: o.value,
    label: o.label,
  }));

  return (
    <>
      <PageShell title="Team" subtitle={subtitle}>
        <div className="grid gap-6 lg:grid-cols-[1fr_min(22rem,100%)] lg:items-start">
          <section
            className="rounded-2xl border border-[var(--app-sidebar-border)] bg-[var(--background)]/35 p-5 md:p-6"
            aria-labelledby="team-roster-heading"
          >
            <div className="flex items-center gap-2">
              <Users
                className="h-5 w-5 shrink-0 text-[var(--app-accent)]"
                aria-hidden
              />
              <h2
                id="team-roster-heading"
                className="text-lg font-semibold text-[var(--foreground)]"
              >
                Who&apos;s on this project
              </h2>
            </div>
            <p className="mt-1 text-sm text-zinc-500">
              {members.length}{" "}
              {members.length === 1 ? "person has" : "people have"} access to{" "}
              <span className="text-zinc-400">{project.name}</span>.
            </p>

            {loadError ? (
              <p className="mt-4 text-sm text-red-400" role="alert">
                {loadError}
              </p>
            ) : null}
            {roleSaveError ? (
              <p className="mt-3 text-sm text-red-400" role="alert">
                {roleSaveError}
              </p>
            ) : null}
            {removeError ? (
              <p className="mt-2 text-sm text-red-400" role="alert">
                {removeError}
              </p>
            ) : null}

            {showInitialSpinner ? (
              <p className="mt-6 text-sm text-zinc-500">Loading roster…</p>
            ) : showEmptyState ? (
              <p className="mt-6 text-sm text-zinc-500">
                No members found. If you just created this project, refresh the
                page.
              </p>
            ) : (
              <ul className="mt-5 divide-y divide-[var(--app-sidebar-border)]/80">
                {members.map((m) => (
                  <motion.li
                    layout
                    key={m.userId}
                    transition={{ layout: { duration: 0.22, ease: [0.25, 0.1, 0.25, 1] } }}
                    className={`py-4 first:pt-0 ${
                      recentlyAddedUserId === m.userId
                        ? "rounded-xl ring-2 ring-[var(--app-accent)]/35 ring-offset-2 ring-offset-[var(--background)]"
                        : ""
                    }`}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                      <div className="flex min-w-0 flex-1 items-start gap-3">
                        <div
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
                          style={{
                            background: "oklch(0.35 0.1 165 / 0.4)",
                            color: "var(--app-accent)",
                          }}
                          aria-hidden
                        >
                          {initials(m.fullName)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-medium text-[var(--foreground)]">
                              {m.fullName}
                            </p>
                            {m.userId === currentUserId ? (
                              <span className="rounded-md border border-zinc-600/60 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                                You
                              </span>
                            ) : null}
                            {m.isOwner ? (
                              <span className="inline-flex items-center gap-1 rounded-md border border-[var(--app-accent)]/35 bg-[var(--app-nav-active-bg)] px-2 py-0.5 text-xs font-medium text-[var(--app-accent)]">
                                <Shield className="h-3 w-3" aria-hidden />
                                Owner
                              </span>
                            ) : null}
                          </div>
                          <p className="truncate text-xs text-zinc-500">
                            {m.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                        {canManageTeam ? (
                          m.isOwner || m.role === "unknown" ? (
                            <span className="inline-flex min-h-[2.25rem] items-center rounded-md border border-[var(--app-sidebar-border)] bg-[var(--background)]/60 px-2.5 py-1 text-xs font-medium text-zinc-300">
                              {roleLabel(m.role)}
                            </span>
                          ) : (
                            <div className="relative w-full sm:w-auto sm:min-w-[11rem]">
                              <AppSelect
                                value={m.role}
                                onValueChange={(v) => {
                                  void handleRoleChange(m, v as ProjectRoleTag);
                                }}
                                options={roleSelectOptions}
                                disabled={roleSavingUserId === m.userId}
                                aria-label={`Role for ${m.fullName}`}
                              />
                              {roleSavingUserId === m.userId ? (
                                <Loader2
                                  className="pointer-events-none absolute right-8 top-1/2 z-10 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-zinc-400"
                                  aria-hidden
                                />
                              ) : null}
                            </div>
                          )
                        ) : (
                          <span className="inline-flex min-h-[2.25rem] items-center rounded-md border border-[var(--app-sidebar-border)] bg-[var(--background)]/60 px-2.5 py-1 text-xs font-medium text-zinc-300">
                            {roleLabel(m.role)}
                          </span>
                        )}

                        {canManageTeam && !m.isOwner ? (
                          removeConfirmUserId === m.userId ? (
                            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 sm:ml-1">
                              <span className="text-xs text-red-100/90">
                                Remove{" "}
                                <span className="font-medium">
                                  {m.fullName}
                                </span>
                                ?
                              </span>
                              <button
                                type="button"
                                disabled={removingUserId === m.userId}
                                onClick={() => setRemoveConfirmUserId(null)}
                                className="rounded-md border border-[var(--app-sidebar-border)] px-2 py-1 text-xs font-medium text-zinc-300 hover:bg-[var(--app-nav-hover-bg)]"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                disabled={removingUserId === m.userId}
                                onClick={() => void handleConfirmRemove(m)}
                                className="inline-flex items-center gap-1 rounded-md border border-red-500/40 bg-red-500/15 px-2 py-1 text-xs font-semibold text-red-200 hover:bg-red-500/25"
                              >
                                {removingUserId === m.userId ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : null}
                                Remove
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setRemoveError(null);
                                setRemoveConfirmUserId(m.userId);
                              }}
                              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[var(--app-sidebar-border)] px-3 py-2 text-xs font-medium text-zinc-400 transition-colors hover:border-red-500/35 hover:bg-red-500/10 hover:text-red-200 sm:ml-1"
                            >
                              <UserMinus className="h-3.5 w-3.5" aria-hidden />
                              Remove
                            </button>
                          )
                        ) : null}
                      </div>
                    </div>
                  </motion.li>
                ))}
              </ul>
            )}
          </section>

          <aside className="rounded-2xl border border-[var(--app-sidebar-border)] bg-[var(--background)]/35 p-5 md:p-6">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              Invite members
            </h2>
            {canManageTeam ? (
              <>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                  Search by name, pick a role, and add them to this project. They
                  must already have a ScrumIQ account. We check project limits
                  before adding someone.
                </p>
                <button
                  type="button"
                  onClick={() => setInviteOpen(true)}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--app-sidebar-border)] bg-[var(--background)]/50 px-4 py-3 text-sm font-semibold text-zinc-100 transition-colors hover:border-[var(--app-accent)]/45 hover:bg-[var(--app-nav-hover-bg)] sm:w-auto"
                >
                  <UserPlus
                    className="h-4 w-4 text-[var(--app-accent)]"
                    aria-hidden
                  />
                  Invite member
                </button>
              </>
            ) : (
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                Only a{" "}
                <span className="text-zinc-400">Product Manager</span> or{" "}
                <span className="text-zinc-400">Scrum Master</span> on this
                project can invite or manage teammates. Your role is{" "}
                <span className="font-medium text-zinc-400">
                  {project.roleTag
                    ? PROJECT_ROLE_LABELS[project.roleTag]
                    : "not set"}
                </span>
                .
              </p>
            )}
          </aside>
        </div>
      </PageShell>

      {canManageTeam ? (
        <InviteMemberModal
          open={inviteOpen}
          onOpenChange={setInviteOpen}
          projectId={project.id}
          projectName={project.name}
          onInviteSuccess={handleInviteSuccess}
        />
      ) : null}
    </>
  );
}
