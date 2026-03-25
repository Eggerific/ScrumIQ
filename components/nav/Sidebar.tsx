"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FolderKanban,
  ChevronRight,
  ArrowLeft,
  ListTodo,
  GitBranch,
  LayoutGrid,
  Users,
  Plus,
  Trash2,
} from "lucide-react";
import { AppLogo } from "@/components/app/AppLogo";
import { useProjectsWorkspace } from "@/components/projects/ProjectsWorkspaceProvider";

export interface SidebarProps {
  fullName: string;
  email: string;
}

interface NavItem {
  href: string;
  label: string;
  icon?: React.ReactNode;
}

/** Project-scoped nav items for project state. */
function getProjectNavItems(projectId: string): NavItem[] {
  const base = `/projects/${projectId}`;
  return [
    { href: `${base}/backlog`, label: "Backlog", icon: <ListTodo className="h-4 w-4 shrink-0" /> },
    { href: `${base}/sprint`, label: "Sprint", icon: <GitBranch className="h-4 w-4 shrink-0" /> },
    { href: `${base}/kanban`, label: "Kanban", icon: <LayoutGrid className="h-4 w-4 shrink-0" /> },
    { href: `${base}/team`, label: "Team", icon: <Users className="h-4 w-4 shrink-0" /> },
  ];
}

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Returns project id when pathname is /projects/[id]/... or /projects/[id], else null. */
function getProjectIdFromPathname(pathname: string): string | null {
  const segments = pathname.split("/").filter(Boolean);
  if (segments[0] !== "projects" || segments.length < 2) return null;
  const id = segments[1];
  return id && id.length > 0 ? id : null;
}

const navItemStagger = 0.03;
const easeSmooth = [0.25, 0.1, 0.25, 1] as const;

export function Sidebar({ fullName, email }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    projects: workspaceProjects,
    openCreateProjectModal,
    requestRemoveProject,
  } = useProjectsWorkspace();
  const projectId = getProjectIdFromPathname(pathname);
  const currentWorkspaceProject =
    projectId !== null
      ? workspaceProjects.find((p) => p.id === projectId)
      : undefined;
  const isProjectState = projectId !== null;

  const [projectsExpanded, setProjectsExpanded] = useState(false);

  const onProjectsClick = () => {
    if (pathname === "/projects") {
      setProjectsExpanded((prev) => !prev);
    } else {
      router.push("/projects");
      setProjectsExpanded(true);
    }
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const navLinkBase =
    "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-[background-color,color,border] duration-200 ease-out border-l-2 border-transparent";
  const navLinkInactive =
    "text-zinc-400 hover:bg-[var(--app-nav-hover-bg)] hover:text-[var(--foreground)]";
  const navLinkActive =
    "border-l-[var(--app-accent)] bg-[var(--app-nav-active-bg)] font-medium text-[var(--foreground)]";

  return (
    <div
      className="relative flex h-full w-56 shrink-0 flex-col"
      style={{
        boxShadow: "4px 0 24px -4px oklch(0.65 0.19 165 / 0.25)",
      }}
    >
      <motion.aside
        initial={false}
        className="relative flex h-full w-full flex-col border-r-0 pr-px"
        style={{ background: "var(--app-sidebar-bg)" }}
      >
      <div className="flex flex-1 flex-col overflow-hidden">
        {isProjectState ? (
          <>
            {/* Project state header */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2, ease: easeSmooth }}
              className="shrink-0 border-b border-[var(--app-sidebar-border)] p-3"
            >
              <Link
                href="/projects"
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-zinc-400 transition-colors duration-200 hover:bg-[var(--app-nav-hover-bg)] hover:text-[var(--foreground)]"
              >
                <ArrowLeft className="h-4 w-4 shrink-0" />
                All projects
              </Link>
              <div className="mt-2 flex items-center gap-2 px-2">
                <motion.span
                  className={cn(
                    "h-2.5 w-2.5 shrink-0 rounded-full",
                    currentWorkspaceProject?.dotClass ?? ""
                  )}
                  style={
                    currentWorkspaceProject
                      ? undefined
                      : { background: "var(--app-accent)" }
                  }
                  aria-hidden
                />
                <span className="truncate text-sm font-medium text-[var(--foreground)]">
                  {currentWorkspaceProject?.name ?? "Project"}
                </span>
              </div>
            </motion.div>
            {/* Project nav */}
            <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
              {getProjectNavItems(projectId).map((item, i) => {
                const isActive = pathname === item.href;
                return (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      duration: 0.25,
                      delay: i * navItemStagger,
                      ease: easeSmooth,
                    }}
                  >
                    <Link
                      href={item.href}
                      className={cn(
                        navLinkBase,
                        isActive ? navLinkActive : navLinkInactive
                      )}
                    >
                      {item.icon}
                      {item.label}
                    </Link>
                  </motion.div>
                );
              })}
            </nav>
          </>
        ) : (
          <>
            {/* App state: logo + main nav */}
            <div className="shrink-0 border-b border-[var(--app-sidebar-border)] p-3">
              <AppLogo />
            </div>
            <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
              <Link
                href="/dashboard"
                className={cn(
                  navLinkBase,
                  pathname === "/dashboard" ? navLinkActive : navLinkInactive
                )}
              >
                <LayoutDashboard className="h-4 w-4 shrink-0" />
                Dashboard
              </Link>
              <div>
                <button
                  type="button"
                  onClick={onProjectsClick}
                  className={cn(
                    "w-full",
                    navLinkBase,
                    pathname === "/projects" ? navLinkActive : navLinkInactive
                  )}
                >
                  <FolderKanban className="h-4 w-4 shrink-0" />
                  Projects
                  <motion.span
                    className="ml-auto shrink-0"
                    animate={{ rotate: projectsExpanded ? 90 : 0 }}
                    transition={{ duration: 0.25, ease: easeSmooth }}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {projectsExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{
                        height: { duration: 0.28, ease: easeSmooth },
                        opacity: { duration: 0.2 },
                      }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-0.5 pl-4 pt-1">
                        {workspaceProjects.map((p, i) => {
                          const projectHref = `/projects/${p.id}`;
                          const isActive =
                            pathname === projectHref ||
                            pathname.startsWith(`${projectHref}/`);
                          return (
                            <motion.div
                              key={p.id}
                              initial={{ opacity: 0, x: -6 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{
                                duration: 0.22,
                                delay: 0.05 + i * navItemStagger,
                                ease: easeSmooth,
                              }}
                              className="flex min-w-0 items-stretch gap-0.5"
                            >
                              <Link
                                href={projectHref}
                                className={cn(
                                  navLinkBase,
                                  "min-w-0 flex-1 py-1.5",
                                  isActive ? navLinkActive : navLinkInactive
                                )}
                              >
                                <span
                                  className={cn(
                                    "h-2 w-2 shrink-0 rounded-full",
                                    p.dotClass
                                  )}
                                  aria-hidden
                                />
                                <span className="truncate">{p.name}</span>
                              </Link>
                              <button
                                type="button"
                                onClick={() => requestRemoveProject(p)}
                                className="flex shrink-0 items-center justify-center rounded-md px-1.5 text-zinc-500 transition-colors hover:bg-red-500/10 hover:text-red-300"
                                aria-label={`Remove ${p.name} from workspace`}
                              >
                                <Trash2 className="h-3.5 w-3.5" aria-hidden />
                              </button>
                            </motion.div>
                          );
                        })}
                        <motion.div
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{
                            duration: 0.22,
                            delay:
                              0.05 +
                              workspaceProjects.length * navItemStagger,
                            ease: easeSmooth,
                          }}
                          className="pt-1"
                        >
                          <button
                            type="button"
                            onClick={openCreateProjectModal}
                            className={cn(
                              "w-full text-left",
                              navLinkBase,
                              "py-1.5 text-zinc-500 transition-colors duration-200 hover:bg-[var(--app-nav-hover-bg)] hover:text-zinc-300"
                            )}
                          >
                            <Plus className="h-4 w-4 shrink-0" />
                            New project
                          </button>
                        </motion.div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </nav>
          </>
        )}
      </div>

      {/* User block (same in both states) */}
      <motion.div
        initial={false}
        className="shrink-0 border-t border-[var(--app-sidebar-border)] p-3"
      >
        <div className="flex items-center gap-2">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium transition-transform duration-200 hover:scale-105"
            style={{
              background: "oklch(0.35 0.1 165 / 0.4)",
              color: "var(--app-accent)",
            }}
            aria-hidden
          >
            {getInitials(fullName)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-[var(--foreground)]">
              {fullName}
            </p>
            <p className="truncate text-xs text-zinc-500" title={email}>
              {email}
            </p>
          </div>
        </div>
        <motion.button
          type="button"
          onClick={handleLogout}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.15 }}
          className="mt-2 w-full rounded-md px-3 py-2 text-left text-sm text-zinc-400 transition-colors duration-200 hover:bg-[var(--app-nav-hover-bg)] hover:text-[var(--foreground)]"
        >
          Log out
        </motion.button>
      </motion.div>
    </motion.aside>
      {/* Highlighted green beam on top so it’s never covered by the aside */}
      {/* Thin green line; glow aligned to same edge */}
      <div
        className="absolute right-0 top-0 bottom-0 z-10 w-px shrink-0 pointer-events-none"
        style={{
          background: "var(--app-accent)",
          boxShadow:
            "0 0 24px 0 oklch(0.65 0.19 165 / 0.5), 0 0 48px 0 oklch(0.65 0.19 165 / 0.3)",
        }}
        aria-hidden
      />
    </div>
  );
}
