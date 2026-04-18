"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  FolderKanban,
  GitBranch,
  LayoutDashboard,
  ListTodo,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useProjectsWorkspace } from "@/components/projects/ProjectsWorkspaceProvider";
import type { ProjectSummary } from "@/components/projects/project-types";
import { cn } from "@/lib/utils";

const easeSmooth = [0.25, 0.1, 0.25, 1] as const;

const PANEL =
  "rounded-xl border border-[var(--auth-border)] bg-[var(--auth-card)]/80 shadow-sm backdrop-blur-sm";

const CHART_CARD = cn(PANEL, "p-4");

const stagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.04 },
  },
};

const rise = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.38, ease: easeSmooth },
  },
};

const statGrid = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.06 },
  },
};

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return reduced;
}

function useCountUp(target: number, enabled: boolean, durationMs = 720) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!enabled) {
      let cancelled = false;
      queueMicrotask(() => {
        if (!cancelled) setValue(0);
      });
      return () => {
        cancelled = true;
      };
    }
    let raf = 0;
    const start = performance.now();
    const from = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(from + (target - from) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, enabled, durationMs]);
  return value;
}

function workspaceStats(projects: ProjectSummary[]) {
  const total = projects.length;
  const backlogLive = projects.filter(
    (p) => p.aiBriefEngagement === "complete"
  ).length;
  const aiPending = projects.filter(
    (p) => p.aiBriefEngagement === "pending"
  ).length;
  const aiNeedsAttention = projects.filter((p) => {
    const e = p.aiBriefEngagement;
    return e === "pending" || e === "dismissed" || e === "skipped";
  }).length;
  const owners = projects.filter((p) => p.isCurrentUserOwner).length;
  return { total, backlogLive, aiPending, aiNeedsAttention, owners };
}

function SprintLineChart({ reducedMotion }: { reducedMotion: boolean }) {
  const uid = useId();
  const gradId = `dash-line-fill-${uid}`;
  const w = 280;
  const h = 100;
  const padL = 28;
  const padR = 8;
  const padT = 8;
  const padB = 22;
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;
  const days = ["D1", "D2", "D3", "D4", "D5", "D6", "D7"];
  const values = [48, 44, 38, 32, 26, 18, 12];
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;

  const pts = values.map((v, i) => {
    const x = padL + (innerW * i) / (values.length - 1);
    const y = padT + innerH * (1 - (v - min) / span);
    return { x, y };
  });
  const lineD = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaD = `${lineD} L ${pts[pts.length - 1].x} ${padT + innerH} L ${pts[0].x} ${padT + innerH} Z`;

  return (
    <div className={CHART_CARD}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-zinc-400">Sprint burndown</p>
          <p className="mt-0.5 text-xs text-zinc-500">
            Sample curve — story points remaining by day
          </p>
        </div>
        <span className="rounded-full border border-[var(--auth-border)] bg-[var(--background)]/40 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-500">
          Preview
        </span>
      </div>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="mt-3 h-32 w-full max-w-full"
        role="img"
        aria-label="Sample sprint burndown line chart"
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--app-accent)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--app-accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <motion.path
          d={areaD}
          fill={`url(#${gradId})`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: reducedMotion ? 0 : 0.45, ease: easeSmooth }}
        />
        <motion.path
          d={lineD}
          fill="none"
          stroke="var(--app-accent)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={reducedMotion ? false : { pathLength: 0, opacity: 0.35 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: reducedMotion ? 0 : 1.15, ease: easeSmooth }}
        />
        {pts.map((p, i) => (
          <motion.circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="3"
            fill="var(--background)"
            stroke="var(--app-accent)"
            strokeWidth="1.5"
            initial={reducedMotion ? false : { scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              delay: reducedMotion ? 0 : 0.35 + i * 0.05,
              duration: 0.25,
              ease: easeSmooth,
            }}
          />
        ))}
        {days.map((d, i) => (
          <text
            key={d}
            x={padL + (innerW * i) / (days.length - 1)}
            y={h - 6}
            textAnchor="middle"
            className="fill-zinc-500"
            style={{ fontSize: "9px" }}
          >
            {d}
          </text>
        ))}
      </svg>
    </div>
  );
}

function BacklogDonutChart({ reducedMotion }: { reducedMotion: boolean }) {
  const cx = 52;
  const cy = 52;
  const r = 36;
  const stroke = 10;
  const c = 2 * Math.PI * r;
  const slices = [
    { pct: 0.45, label: "To do", color: "var(--app-accent)" },
    { pct: 0.3, label: "In progress", color: "oklch(0.55 0.12 165)" },
    { pct: 0.25, label: "Done", color: "oklch(0.42 0.04 260)" },
  ] as const;
  let rot = -90;
  return (
    <div className={CHART_CARD}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-zinc-400">Backlog mix</p>
          <p className="mt-0.5 text-xs text-zinc-500">
            Sample share of items by status
          </p>
        </div>
        <span className="rounded-full border border-[var(--auth-border)] bg-[var(--background)]/40 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-500">
          Preview
        </span>
      </div>
      <div className="mt-3 flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:justify-center sm:gap-6">
        <motion.svg
          viewBox="0 0 104 104"
          className="h-28 w-28 shrink-0"
          role="img"
          aria-label="Sample backlog donut chart"
          initial={reducedMotion ? false : { scale: 0.94, opacity: 0.65 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.45, ease: easeSmooth }}
        >
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--auth-border)" strokeWidth={stroke} />
          {slices.map((s) => {
            const len = s.pct * c;
            const gap = c - len;
            const el = (
              <motion.circle
                key={s.label}
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth={stroke}
                strokeDasharray={`${len} ${gap}`}
                strokeLinecap="round"
                transform={`rotate(${rot} ${cx} ${cy})`}
                initial={reducedMotion ? false : { strokeDashoffset: len }}
                animate={{ strokeDashoffset: 0 }}
                transition={{ duration: 0.9, ease: easeSmooth }}
              />
            );
            rot += s.pct * 360;
            return el;
          })}
        </motion.svg>
        <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-zinc-500 sm:flex-col sm:items-start">
          {slices.map((s) => (
            <li key={s.label} className="flex items-center gap-2">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: s.color }}
                aria-hidden
              />
              {s.label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ScrumAIBarChart({ reducedMotion }: { reducedMotion: boolean }) {
  const rows = [
    { label: "Velocity", value: 78 },
    { label: "Points / member", value: 62 },
    { label: "Points by status", value: 89 },
  ] as const;

  return (
    <div className={CHART_CARD}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-zinc-400">Scrum AI signals</p>
          <p className="mt-0.5 text-xs text-zinc-500">
            Sample sprint insight scores (0–100)
          </p>
        </div>
        <span className="rounded-full border border-[var(--auth-border)] bg-[var(--background)]/40 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-500">
          Preview
        </span>
      </div>
      <div className="mt-3 space-y-3">
        {rows.map((row, i) => (
          <div key={row.label}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-zinc-400">{row.label}</span>
              <span className="tabular-nums text-zinc-500">{row.value}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-[var(--auth-border)]/70">
              <motion.div
                className="h-full rounded-full"
                style={{
                  background:
                    "linear-gradient(90deg, var(--app-accent), oklch(0.55 0.12 165))",
                }}
                initial={{ width: reducedMotion ? `${row.value}%` : "0%" }}
                animate={{ width: `${row.value}%` }}
                transition={{
                  duration: reducedMotion ? 0 : 0.85,
                  delay: reducedMotion ? 0 : 0.08 + i * 0.08,
                  ease: easeSmooth,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecentActivityPanel({
  projects,
  projectsLoadError,
}: {
  projects: ProjectSummary[];
  projectsLoadError: string | null;
}) {
  const items = useMemo(() => {
    const out: { text: string; time: string; tone: "neutral" | "accent" }[] =
      [];
    if (projectsLoadError) {
      out.push({
        text: `Projects could not refresh: ${projectsLoadError}`,
        time: "Just now",
        tone: "accent",
      });
    }
    const pending = projects.filter((p) => p.aiBriefEngagement === "pending");
    pending.slice(0, 2).forEach((p) => {
      out.push({
        text: `“${p.name}” is waiting on the AI brief`,
        time: "Workspace",
        tone: "accent",
      });
    });
    const complete = projects.filter((p) => p.aiBriefEngagement === "complete");
    complete.slice(0, 2).forEach((p) => {
      out.push({
        text: `Backlog saved for “${p.name}”`,
        time: "Workspace",
        tone: "neutral",
      });
    });
    if (out.length === 0) {
      out.push(
        {
          text: "Create a project to start your first AI-guided backlog",
          time: "Tip",
          tone: "neutral",
        },
        {
          text: "Charts on this page preview motion + layout — wire real metrics next",
          time: "Tip",
          tone: "neutral",
        }
      );
    }
    return out.slice(0, 5);
  }, [projects, projectsLoadError]);

  return (
    <div className={CHART_CARD}>
      <p className="text-sm font-medium text-zinc-400">Workspace activity</p>
      <p className="mt-0.5 text-xs text-zinc-500">
        Pulled from your loaded projects list
      </p>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <motion.li
            key={`${item.text}-${item.time}`}
            layout
            className={cn(
              "rounded-lg border px-3 py-2 transition-colors duration-200",
              "border-[var(--auth-border)]/70 bg-[var(--background)]/30",
              "hover:border-[var(--app-accent)]/35 hover:bg-[var(--background)]/45"
            )}
            whileHover={item.tone === "accent" ? { x: 2 } : { x: 1 }}
            transition={{ type: "spring", stiffness: 420, damping: 28 }}
          >
            <p className="text-xs text-zinc-300">{item.text}</p>
            <p className="mt-0.5 text-[11px] text-zinc-500">{item.time}</p>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  loading,
  numeric,
  delay = 0,
}: {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  loading: boolean;
  numeric?: number;
  delay?: number;
}) {
  const animateNumber = !loading && numeric != null;
  const count = useCountUp(numeric ?? 0, animateNumber);
  const display = loading ? value : numeric == null ? value : String(count);

  return (
    <motion.div
      variants={rise}
      className={cn(
        PANEL,
        "group relative overflow-hidden p-5",
        "transition-[box-shadow,transform,border-color] duration-300",
        "hover:-translate-y-0.5 hover:border-[var(--app-accent)]/45 hover:shadow-lg hover:shadow-[var(--app-accent)]/10"
      )}
      whileTap={{ scale: 0.995 }}
      onPointerMove={(e) => {
        const el = e.currentTarget;
        const r = el.getBoundingClientRect();
        el.style.setProperty(
          "--mx",
          `${((e.clientX - r.left) / r.width) * 100}%`
        );
        el.style.setProperty(
          "--my",
          `${((e.clientY - r.top) / r.height) * 100}%`
        );
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(600px circle at var(--mx,50%) var(--my,0%), oklch(0.65 0.19 165 / 0.08), transparent 40%)",
        }}
        aria-hidden
      />
      <div className="relative flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-zinc-400">{label}</p>
        <Icon
          className="h-4 w-4 shrink-0 text-[var(--app-accent)] opacity-90 transition-transform duration-300 group-hover:scale-110"
          aria-hidden
        />
      </div>
      <motion.p
        className="relative mt-3 text-3xl font-semibold tabular-nums tracking-tight sm:text-4xl"
        style={{ color: "var(--foreground)" }}
        initial={{ opacity: 0.35, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay, ease: easeSmooth }}
      >
        {display}
      </motion.p>
      <p className="relative mt-1.5 text-xs leading-relaxed text-zinc-500">{hint}</p>
    </motion.div>
  );
}

/** Dashboard — workspace-aware stats, motion, and preview charts. */
export function Dashboard({ userName }: { userName: string }) {
  const reducedMotion = usePrefersReducedMotion();
  const {
    projects,
    projectsHydrated,
    projectsLoading,
    projectsLoadError,
    openCreateProjectModal,
    atProjectLimit,
  } = useProjectsWorkspace();

  const loading = projectsLoading || !projectsHydrated;
  const stats = useMemo(() => workspaceStats(projects), [projects]);

  const headline = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  const dateLabel = useMemo(
    () =>
      new Date().toLocaleDateString(undefined, {
        weekday: "long",
        month: "short",
        day: "numeric",
      }),
    []
  );

  const estimatedStories = useMemo(() => {
    if (stats.backlogLive <= 0) return 0;
    return stats.backlogLive * 18 + Math.min(64, stats.total * 4);
  }, [stats.backlogLive, stats.total]);

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="space-y-8 pb-10"
    >
      <motion.div
        variants={rise}
        className={cn(
          PANEL,
          "relative overflow-hidden p-6 md:p-7",
          "bg-gradient-to-br from-[var(--auth-card)]/90 via-[var(--auth-card)]/70 to-[var(--background)]/40"
        )}
      >
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full blur-3xl"
          style={{ background: "oklch(0.65 0.19 165 / 0.12)" }}
          aria-hidden
        />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--auth-border)] bg-[var(--background)]/35 px-3 py-1 text-xs text-zinc-400">
              <CalendarDays
                className="h-3.5 w-3.5 text-[var(--app-accent)]"
                aria-hidden
              />
              <span>{dateLabel}</span>
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] md:text-3xl">
              {headline}, {userName}.{" "}
              <span className="text-zinc-400">Here’s your workspace pulse.</span>
            </h2>
            <p className="max-w-xl text-sm leading-relaxed text-zinc-400 md:text-[0.95rem]">
              Stat tiles pull from the projects in your workspace (this session).
              The charts are visual previews until live sprint and backlog metrics
              are wired in.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center lg:flex-col lg:items-stretch">
            <Button asChild className="shadow-md shadow-[var(--app-accent)]/15">
              <Link href="/projects" className="gap-2">
                Open projects
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => openCreateProjectModal()}
              disabled={atProjectLimit}
              className="border-[var(--auth-border)] bg-[var(--background)]/25 hover:bg-[var(--background)]/40"
            >
              <Zap className="h-4 w-4 text-[var(--app-accent)]" aria-hidden />
              New project
            </Button>
          </div>
        </div>
      </motion.div>

      <motion.div
        variants={statGrid}
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatCard
          label="Projects"
          value="—"
          hint="Everything in your workspace list"
          icon={FolderKanban}
          loading={loading}
          numeric={stats.total}
          delay={0}
        />
        <StatCard
          label="Sprint-ready"
          value="—"
          hint="Projects with a saved backlog (AI brief complete)"
          icon={GitBranch}
          loading={loading}
          numeric={stats.backlogLive}
          delay={0.04}
        />
        <StatCard
          label="AI queue"
          value="—"
          hint="Projects still waiting on the brief step"
          icon={LayoutDashboard}
          loading={loading}
          numeric={stats.aiPending}
          delay={0.08}
        />
        <StatCard
          label="Stories (est.)"
          value="—"
          hint="Lightweight estimate from sprint-ready projects (not stored totals yet)"
          icon={ListTodo}
          loading={loading}
          numeric={estimatedStories}
          delay={0.12}
        />
      </motion.div>

      <motion.div
        variants={rise}
        className={cn(
          PANEL,
          "grid gap-4 p-4 sm:grid-cols-3",
          "transition-colors duration-300 hover:border-[var(--auth-border)]"
        )}
      >
        {[
          {
            k: "Owners",
            v: loading ? "…" : String(stats.owners),
            d: "Projects you created in this workspace",
          },
          {
            k: "Needs attention",
            v: loading ? "…" : String(stats.aiNeedsAttention),
            d: "Pending, skipped, or dismissed brief states",
          },
          {
            k: "Capacity",
            v: atProjectLimit ? "Full" : "Open",
            d: atProjectLimit ? "Project list limit reached" : "Room for more projects",
          },
        ].map((row) => (
          <div
            key={row.k}
            className="rounded-lg border border-transparent px-3 py-2 transition-colors duration-200 hover:border-[var(--auth-border)]/80 hover:bg-[var(--background)]/25"
          >
            <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
              {row.k}
            </p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-[var(--foreground)]">
              {row.v}
            </p>
            <p className="mt-1 text-xs text-zinc-500">{row.d}</p>
          </div>
        ))}
      </motion.div>

      <div className="grid gap-4 xl:grid-cols-12">
        <motion.div variants={rise} className="space-y-4 xl:col-span-7">
          <SprintLineChart reducedMotion={reducedMotion} />
          <ScrumAIBarChart reducedMotion={reducedMotion} />
        </motion.div>
        <motion.div variants={rise} className="space-y-4 xl:col-span-5">
          <BacklogDonutChart reducedMotion={reducedMotion} />
          <RecentActivityPanel
            projects={projects}
            projectsLoadError={projectsLoadError}
          />
        </motion.div>
      </div>
    </motion.div>
  );
}
