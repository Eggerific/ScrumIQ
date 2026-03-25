"use client";

import Link from "next/link";
import {
  animate,
  motion,
  useInView,
  useMotionValueEvent,
  useScroll,
} from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Brain,
  ChevronDown,
  FolderKanban,
  LogIn,
  LayoutDashboard,
  Menu,
  SquareKanban,
  Sparkles,
  UserPlus,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ScrumIQLogoMark } from "@/components/app/AppLogo";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";
import { MAX_PROJECTS_ON_WORKSPACE_LIST } from "@/lib/projects/constants";
import { cn } from "@/lib/utils";
import { LandingAiChatDemo } from "./LandingAiChatDemo";
import { LandingKanbanPreview } from "./LandingKanbanPreview";

const ease = [0.25, 0.1, 0.25, 1] as const;

const viewport = { once: true as const, amount: 0.35 as const, margin: "-60px" as const };

const NAV_LINKS = [
  { href: "#metrics", id: "metrics", label: "Impact" },
  { href: "#features", id: "features", label: "Features" },
  { href: "#playground", id: "playground", label: "AI demo" },
  { href: "#board", id: "board", label: "Board" },
] as const;

const NOISE_SVG = encodeURIComponent(
  `<svg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>`
);

/** Soft white wave wash at bottom of viewport (moved from app main). */
function LandingWhiteWave() {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-0 h-[min(32vh,260px)] select-none"
      aria-hidden
    >
      <svg
        className="h-full w-full text-foreground/10"
        preserveAspectRatio="none"
        viewBox="0 0 1440 160"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill="currentColor"
          d="M0 96L60 87.3C120 78.7 240 61.3 360 56C480 50.7 600 57.3 720 64C840 70.7 960 77.3 1080 76C1200 74.7 1320 65.3 1380 60.7L1440 56V160H1380C1320 160 1200 160 1080 160C960 160 840 160 720 160C600 160 480 160 360 160C240 160 120 160 60 160H0V96Z"
        />
        <path
          fill="currentColor"
          className="opacity-50"
          d="M0 128L80 120C160 112 320 96 480 90.7C640 85.3 800 90.7 960 93.3C1120 96 1280 96 1360 96L1440 96V160H1360C1280 160 1120 160 960 160C800 160 640 160 480 160C320 160 160 160 80 160H0V128Z"
        />
      </svg>
    </div>
  );
}

function LandingBackdrop() {
  return (
    <>
      <div
        className="pointer-events-none fixed inset-0 z-0 bg-[length:200%_200%] animate-gradient-shift"
        style={{ backgroundImage: "var(--gradient-auth)" }}
        aria-hidden
      />
      <div
        className="landing-page-grid pointer-events-none fixed inset-0 z-0"
        aria-hidden
      />
      <div
        className="landing-noise-drift pointer-events-none fixed inset-0 z-0 mix-blend-soft-light"
        style={{
          opacity: 0.045,
          backgroundImage: `url("data:image/svg+xml,${NOISE_SVG}")`,
        }}
        aria-hidden
      />
      <LandingWhiteWave />
      <div
        className="pointer-events-none fixed inset-0 z-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.25),inset_0_-80px_120px_-40px_rgba(0,0,0,0.35)]"
        aria-hidden
      />
    </>
  );
}

function LandingSiteHeader() {
  const [elevated, setElevated] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("");
  const headerRef = useRef<HTMLElement>(null);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (y) => {
    setElevated(y > 20);
  });

  useEffect(() => {
    const ids: string[] = NAV_LINKS.map((l) => l.id);
    const els = ids
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];
    if (els.length === 0) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) => ids.indexOf(a.target.id) - ids.indexOf(b.target.id)
          );
        if (visible[0]) setActiveSection(visible[0].target.id);
      },
      { rootMargin: "-42% 0px -42% 0px", threshold: [0, 0.05] }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (!headerRef.current?.contains(e.target as Node)) {
        setMobileOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [mobileOpen]);

  return (
    <header
      ref={headerRef}
      className={cn(
        "sticky top-0 z-50 border-b px-4 py-3 backdrop-blur-xl transition-[padding,background-color,border-color,box-shadow] duration-300 md:px-8",
        elevated
          ? "border-[var(--auth-accent)]/18 bg-[var(--background)]/90 py-2.5 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.55),0_0_0_1px_oklch(0.65_0.19_165_/0.08)] md:py-3"
          : "border-[var(--auth-border)]/40 bg-[var(--background)]/60 md:py-4"
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
        <Link
          href="/"
          className="group flex min-w-0 shrink-0 items-center gap-2.5 sm:gap-3"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[var(--auth-border)] bg-[var(--auth-card)]/90 shadow-[0_0_28px_-10px_oklch(0.65_0.19_165_/0.45)] transition-[border-color,box-shadow] group-hover:border-[var(--auth-accent)]/40 [&_svg]:h-full [&_svg]:w-full">
            <ScrumIQLogoMark aria-hidden />
          </span>
          <span className="truncate text-lg font-bold tracking-tight text-white transition-opacity group-hover:opacity-90">
            <span className="bg-gradient-to-r from-white via-white to-[var(--auth-accent)] bg-clip-text text-transparent">
              ScrumIQ
            </span>
          </span>
        </Link>

        <nav
          className="hidden flex-1 justify-center md:flex"
          aria-label="Page sections"
        >
          <div className="flex items-center gap-7 text-sm font-medium">
          {NAV_LINKS.map(({ href, id, label }) => (
            <a
              key={id}
              href={href}
              className={cn(
                "relative py-1 transition-colors",
                activeSection === id
                  ? "text-[var(--auth-accent)]"
                  : "text-zinc-400 hover:text-white"
              )}
            >
              {label}
              <span
                className={cn(
                  "absolute -bottom-0.5 left-0 right-0 h-px rounded-full bg-[var(--auth-accent)] transition-opacity duration-200",
                  activeSection === id ? "opacity-100" : "opacity-0"
                )}
                aria-hidden
              />
            </a>
          ))}
          </div>
        </nav>

        <div className="flex shrink-0 items-center justify-end gap-2 sm:gap-3">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--auth-border)] bg-[var(--auth-card)]/60 text-zinc-300 transition-colors hover:border-[var(--auth-accent)]/35 hover:text-white md:hidden"
            aria-expanded={mobileOpen}
            aria-controls="landing-nav-mobile"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileOpen((o) => !o)}
          >
            {mobileOpen ? (
              <X className="h-5 w-5" aria-hidden />
            ) : (
              <Menu className="h-5 w-5" aria-hidden />
            )}
          </button>
          <Link
            href="/login"
            className="hidden items-center justify-center gap-2 rounded-lg border border-[var(--auth-border)] bg-[var(--auth-card)]/60 px-3 py-2 text-sm font-medium text-foreground backdrop-blur-sm transition-colors hover:border-[var(--auth-accent)]/40 hover:bg-[var(--auth-card)] sm:inline-flex sm:px-4"
          >
            <LogIn className="h-4 w-4 shrink-0" aria-hidden />
            Log in
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--auth-accent)] px-3 py-2 text-sm font-medium text-white shadow-[0_0_24px_-4px_oklch(0.65_0.19_165_/0.45)] transition-[filter] hover:brightness-110 sm:px-4"
          >
            <UserPlus className="h-4 w-4 shrink-0" aria-hidden />
            Sign up
          </Link>
        </div>

        {mobileOpen ? (
          <div
            id="landing-nav-mobile"
            className="absolute left-0 right-0 top-[calc(100%+10px)] z-50 flex flex-col gap-1 rounded-xl border border-[var(--auth-border)] bg-[var(--auth-card)]/95 p-2 shadow-[0_24px_50px_-20px_rgba(0,0,0,0.65)] backdrop-blur-xl md:hidden"
          >
            {NAV_LINKS.map(({ href, id, label }) => (
              <a
                key={id}
                href={href}
                className={cn(
                  "rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  activeSection === id
                    ? "bg-[var(--auth-accent)]/12 text-[var(--auth-accent)]"
                    : "text-zinc-300 hover:bg-[var(--auth-bg)] hover:text-white"
                )}
                onClick={() => setMobileOpen(false)}
              >
                {label}
              </a>
            ))}
            <hr className="my-1 border-[var(--auth-border)]" />
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-200 hover:bg-[var(--auth-bg)]"
              onClick={() => setMobileOpen(false)}
            >
              <LogIn className="h-4 w-4" aria-hidden />
              Log in
            </Link>
          </div>
        ) : null}
      </div>
    </header>
  );
}

function AnimatedNumber({
  value,
  prefix = "",
  suffix = "",
  reducedMotion,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  reducedMotion: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  const [n, setN] = useState(reducedMotion ? value : 0);

  useEffect(() => {
    if (reducedMotion || !isInView) return;
    const controls = animate(0, value, {
      duration: 1.35,
      ease,
      onUpdate(latest) {
        setN(Math.round(latest));
      },
    });
    return () => controls.stop();
  }, [isInView, value, reducedMotion]);

  return (
    <span ref={ref} className="tabular-nums tracking-tight">
      {prefix}
      {n}
      {suffix}
    </span>
  );
}

function Reveal({
  children,
  className,
  reducedMotion,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  reducedMotion: boolean;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={
        reducedMotion
          ? { opacity: 1, y: 0 }
          : { opacity: 0, y: 36 }
      }
      whileInView={{ opacity: 1, y: 0 }}
      viewport={viewport}
      transition={{ duration: 0.7, delay, ease }}
    >
      {children}
    </motion.div>
  );
}

export function HomeLanding() {
  const reducedMotion = usePrefersReducedMotion();

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background">
      <LandingBackdrop />

      <div className="relative z-10">
        <LandingSiteHeader />

        <main>
          {/* Hero */}
          <section className="relative flex min-h-[92vh] flex-col items-center justify-center px-6 pb-16 pt-10 md:px-10">
            <div className="mx-auto max-w-3xl text-center">
              <motion.p
                initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease }}
                className="text-lg font-medium tracking-wide text-white/90 md:text-xl"
              >
                Welcome to
              </motion.p>
              <motion.h1
                initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.06, ease }}
                className="mt-3 flex flex-wrap items-center justify-center gap-3 sm:gap-4 md:gap-5"
              >
                <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[var(--auth-border)] bg-[var(--auth-card)]/90 shadow-[0_0_32px_-10px_oklch(0.65_0.19_165_/0.35)] sm:h-16 sm:w-16 md:h-[4.5rem] md:w-[4.5rem] [&_svg]:h-full [&_svg]:w-full">
                  <ScrumIQLogoMark aria-hidden />
                </span>
                <span className="bg-gradient-to-r from-white via-white to-[var(--auth-accent)] bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl md:text-6xl lg:text-7xl">
                  ScrumIQ
                </span>
              </motion.h1>
              <motion.p
                initial={reducedMotion ? { opacity: 1 } : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.14, ease: "easeOut" }}
                className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-[var(--app-text-muted)] md:text-lg"
              >
                The calm command center for scrum teams — projects, an AI-ready
                brief, and a board that stays readable when velocity gets loud.
              </motion.p>
              <motion.div
                initial={reducedMotion ? { scaleX: 1 } : { scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.5, delay: 0.22, ease }}
                className="mx-auto mt-8 h-px w-28 origin-center bg-gradient-to-r from-transparent via-[var(--auth-accent)] to-transparent"
              />
              <motion.div
                initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.28, ease }}
                className="mt-12 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center"
              >
                <Link
                  href="/register"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[var(--auth-accent)] px-8 text-base font-semibold text-white shadow-[0_0_32px_-6px_oklch(0.65_0.19_165_/0.5)] transition-[filter,transform] hover:brightness-110 active:scale-[0.99]"
                >
                  <UserPlus className="h-5 w-5 shrink-0" aria-hidden />
                  Get started
                </Link>
                <Link
                  href="/login"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-[var(--auth-border)] bg-[var(--auth-card)]/80 px-8 text-base font-semibold text-foreground backdrop-blur-sm transition-colors hover:border-[var(--auth-accent)]/35 hover:bg-[var(--auth-card)]"
                >
                  <LogIn className="h-5 w-5 shrink-0" aria-hidden />
                  I already have an account
                </Link>
              </motion.div>
            </div>

            <motion.a
              href="#metrics"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.5 }}
              className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1 text-zinc-500"
              aria-label="Scroll to impact metrics"
            >
              <span className="text-xs font-medium uppercase tracking-widest">
                Explore
              </span>
              <ChevronDown className="h-5 w-5 motion-safe:animate-bounce" />
            </motion.a>
          </section>

          {/* Stats */}
          <section
            id="metrics"
            className="scroll-mt-24 border-t border-[var(--auth-border)]/50 bg-[var(--auth-bg)]/35 px-6 py-20 md:px-10"
          >
            <div className="mx-auto max-w-6xl">
              <Reveal reducedMotion={reducedMotion} className="mx-auto max-w-2xl text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--auth-accent)]">
                  Built for flow state
                </p>
                <h2 className="mt-4 text-3xl font-bold tracking-tight text-white md:text-4xl">
                  Numbers your team actually feels
                </h2>
                <p className="mt-3 text-[var(--app-text-muted)]">
                  Snapshot metrics — tuned to how ScrumIQ is shaped today.
                </p>
              </Reveal>

              <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  {
                    label: "Projects on your bench",
                    hint: "Workspace capacity in this release",
                    value: MAX_PROJECTS_ON_WORKSPACE_LIST,
                    suffix: "",
                    icon: FolderKanban,
                  },
                  {
                    label: "Board lanes",
                    hint: "Drag from idea → shipped",
                    value: 3,
                    suffix: "",
                    icon: SquareKanban,
                  },
                  {
                    label: "AI brief touchpoints",
                    hint: "Structured context per project",
                    value: 1,
                    suffix: "",
                    icon: Brain,
                  },
                  {
                    label: "Theme fidelity",
                    hint: "Dark UI, green beam accent",
                    value: 100,
                    suffix: "%",
                    icon: Sparkles,
                  },
                ].map((card, i) => (
                  <motion.div
                    key={card.label}
                    initial={
                      reducedMotion
                        ? { opacity: 1, y: 0 }
                        : { opacity: 0, y: 32 }
                    }
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={viewport}
                    transition={{ duration: 0.65, delay: i * 0.08, ease }}
                    whileHover={
                      reducedMotion ? undefined : { y: -8, transition: { duration: 0.22, ease } }
                    }
                    whileTap={
                      reducedMotion ? undefined : { scale: 0.985, transition: { duration: 0.15 } }
                    }
                    className="relative cursor-default overflow-hidden rounded-2xl border border-[var(--auth-border)] bg-[var(--auth-card)]/90 p-6 shadow-lg transition-[box-shadow] hover:border-[var(--auth-accent)]/20 hover:shadow-[0_0_36px_-12px_oklch(0.65_0.19_165_/0.2)]"
                  >
                    <div
                      className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-20 blur-2xl"
                      style={{ background: "var(--auth-accent)" }}
                      aria-hidden
                    />
                    <card.icon
                      className="relative h-5 w-5 text-[var(--auth-accent)]"
                      aria-hidden
                    />
                    <p className="relative mt-4 text-3xl font-bold text-white md:text-4xl">
                      <AnimatedNumber
                        value={card.value}
                        suffix={card.suffix}
                        reducedMotion={reducedMotion}
                      />
                    </p>
                    <p className="relative mt-1 text-sm font-semibold text-zinc-300">
                      {card.label}
                    </p>
                    <p className="relative mt-1 text-xs text-zinc-500">
                      {card.hint}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Features bento */}
          <section
            id="features"
            className="scroll-mt-24 px-6 py-20 md:px-10"
          >
            <div className="mx-auto max-w-6xl">
              <Reveal reducedMotion={reducedMotion} className="mx-auto max-w-2xl text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--auth-accent)]">
                  Under the hood
                </p>
                <h2 className="mt-4 text-3xl font-bold tracking-tight text-white md:text-4xl">
                  Everything in one breathable surface{" "}
                </h2>
                <p className="mt-3 text-[var(--app-text-muted)]">
                  Cards scale, copy stays quiet, motion stays optional — parity
                  with your in-app shell.
                </p>
              </Reveal>

              <div className="mt-14 grid gap-4 md:grid-cols-6 md:gap-5">
                <motion.article
                  initial={
                    reducedMotion
                      ? { opacity: 1, scale: 1 }
                      : { opacity: 0, scale: 0.97 }
                  }
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={viewport}
                  transition={{ duration: 0.65, delay: 0, ease }}
                  whileHover={
                    reducedMotion ? undefined : { y: -6, transition: { duration: 0.25, ease } }
                  }
                  whileTap={
                    reducedMotion ? undefined : { scale: 0.995, transition: { duration: 0.15 } }
                  }
                  className="group relative flex min-h-[220px] flex-col justify-between overflow-hidden rounded-2xl border border-[var(--auth-border)] bg-[var(--auth-card)]/90 p-6 transition-[box-shadow] hover:border-[var(--auth-accent)]/25 hover:shadow-[0_20px_50px_-24px_rgba(0,0,0,0.55)] md:col-span-4 md:row-span-2 md:min-h-[320px]"
                >
                  <div
                    className="pointer-events-none absolute inset-0 opacity-40 transition-opacity group-hover:opacity-55"
                    style={{
                      background:
                        "radial-gradient(ellipse 80% 60% at 30% 20%, oklch(0.65 0.19 165 / 0.25), transparent 55%)",
                    }}
                    aria-hidden
                  />
                  <div className="relative">
                    <div className="inline-flex items-center gap-2 rounded-full border border-[var(--auth-border)] bg-[var(--auth-bg)] px-3 py-1 text-xs font-medium text-[var(--auth-accent)]">
                      <Brain className="h-3.5 w-3.5" aria-hidden />
                      AI brief
                    </div>
                    <h3 className="mt-5 text-2xl font-bold text-white md:text-3xl">
                      Project context that lands fully formed
                    </h3>
                    <p className="mt-3 max-w-md text-sm leading-relaxed text-zinc-400">
                      Kick off with a structured brief so backlog conversations
                      start sharp — less “what were we building again?”
                    </p>
                  </div>
                  <div className="relative mt-6 flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                    {["Scope", "Risks", "Stakeholders", "Milestones"].map(
                      (t) => (
                        <span
                          key={t}
                          className="rounded-md border border-[var(--auth-border)] bg-[var(--auth-bg)] px-2 py-1"
                        >
                          {t}
                        </span>
                      )
                    )}
                  </div>
                </motion.article>

                <motion.article
                  initial={
                    reducedMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: 24 }
                  }
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={viewport}
                  transition={{ duration: 0.6, delay: 0.06, ease }}
                  whileHover={
                    reducedMotion ? undefined : { y: -5, transition: { duration: 0.22, ease } }
                  }
                  whileTap={
                    reducedMotion ? undefined : { scale: 0.99, transition: { duration: 0.15 } }
                  }
                  className="flex flex-col justify-between rounded-2xl border border-[var(--auth-border)] bg-[var(--auth-card)]/90 p-6 transition-[box-shadow] hover:border-[var(--auth-accent)]/25 hover:shadow-[0_16px_40px_-20px_rgba(0,0,0,0.5)] md:col-span-2"
                >
                  <LayoutDashboard className="h-5 w-5 text-[var(--auth-accent)]" />
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      Dashboards that breathe
                    </h3>
                    <p className="mt-2 text-sm text-zinc-400">
                      Burndown-friendly charts and activity panels — same visual
                      language as the rest of ScrumIQ.
                    </p>
                  </div>
                  <BarChart3 className="mt-4 h-8 w-8 self-end text-zinc-600" />
                </motion.article>

                <motion.article
                  initial={
                    reducedMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: 24 }
                  }
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={viewport}
                  transition={{ duration: 0.6, delay: 0.12, ease }}
                  whileHover={
                    reducedMotion ? undefined : { y: -5, transition: { duration: 0.22, ease } }
                  }
                  whileTap={
                    reducedMotion ? undefined : { scale: 0.99, transition: { duration: 0.15 } }
                  }
                  className="flex flex-col justify-between rounded-2xl border border-[var(--auth-border)] bg-[var(--auth-card)]/90 p-6 transition-[box-shadow] hover:border-[var(--auth-accent)]/25 hover:shadow-[0_16px_40px_-20px_rgba(0,0,0,0.5)] md:col-span-2"
                >
                  <Users className="h-5 w-5 text-[var(--auth-accent)]" />
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      Room for the whole crew
                    </h3>
                    <p className="mt-2 text-sm text-zinc-400">
                      Built for facilitators, ICs, and leads — permissions and
                      polish land in later slices.
                    </p>
                  </div>
                  <div className="mt-4 flex -space-x-2 self-end">
                    {["bg-emerald-400/80", "bg-teal-400/70", "bg-cyan-400/60"].map(
                      (c) => (
                        <span
                          key={c}
                          className={cn(
                            "inline-block h-8 w-8 rounded-full border-2 border-[var(--auth-card)]",
                            c
                          )}
                          aria-hidden
                        />
                      )
                    )}
                  </div>
                </motion.article>

                <motion.article
                  initial={
                    reducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }
                  }
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={viewport}
                  transition={{ duration: 0.6, delay: 0.08, ease }}
                  whileHover={
                    reducedMotion ? undefined : { y: -5, transition: { duration: 0.22, ease } }
                  }
                  whileTap={
                    reducedMotion ? undefined : { scale: 0.99, transition: { duration: 0.15 } }
                  }
                  className="flex flex-col justify-between rounded-2xl border border-[var(--auth-border)] bg-[var(--auth-card)]/90 p-6 transition-[box-shadow] hover:border-[var(--auth-accent)]/25 hover:shadow-[0_16px_40px_-20px_rgba(0,0,0,0.5)] md:col-span-3"
                >
                  <Zap className="h-5 w-5 text-[var(--auth-accent)]" />
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      Fast stance, slow jitter
                    </h3>
                    <p className="mt-2 text-sm text-zinc-400">
                      Motion is staggered and scroll-revealed — trimmed
                      automatically when you prefer reduced motion.
                    </p>
                  </div>
                </motion.article>

                <motion.article
                  initial={
                    reducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }
                  }
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={viewport}
                  transition={{ duration: 0.6, delay: 0.14, ease }}
                  whileHover={
                    reducedMotion ? undefined : { y: -5, transition: { duration: 0.22, ease } }
                  }
                  whileTap={
                    reducedMotion ? undefined : { scale: 0.99, transition: { duration: 0.15 } }
                  }
                  className="flex flex-col justify-between rounded-2xl border border-[var(--auth-border)] bg-[var(--auth-card)]/90 p-6 transition-[box-shadow] hover:border-[var(--auth-accent)]/25 hover:shadow-[0_16px_40px_-20px_rgba(0,0,0,0.5)] md:col-span-3"
                >
                  <FolderKanban className="h-5 w-5 text-[var(--auth-accent)]" />
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      Bench-aware workspaces
                    </h3>
                    <p className="mt-2 text-sm text-zinc-400">
                      Up to {MAX_PROJECTS_ON_WORKSPACE_LIST} living projects with
                      create, celebrate, and remove flows tuned for focus.
                    </p>
                  </div>
                </motion.article>
              </div>
            </div>
          </section>

          {/* AI chat playground */}
          <section
            id="playground"
            className="scroll-mt-24 border-t border-[var(--auth-border)]/50 bg-[var(--auth-bg)]/25 px-6 py-20 md:px-10"
          >
            <div className="mx-auto max-w-6xl">
              <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-14">
                <Reveal reducedMotion={reducedMotion} className="max-w-xl">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--auth-accent)]">
                    Playground
                  </p>
                  <h2 className="mt-4 text-3xl font-bold tracking-tight text-white md:text-4xl">
                    From brief to epics and user stories
                  </h2>
                  <p className="mt-4 text-[var(--app-text-muted)]">
                    The real assistant will read your project brief and emit
                    structured backlog items. Here, chip prompts mimic that flow
                    with streaming text — same UI chrome, no backend on the
                    landing page.
                  </p>
                  <ul className="mt-6 space-y-2 text-sm text-zinc-400">
                    <li>• Epics, classic user stories, and epic → child stories</li>
                    <li>• Aligned with where your AI brief types are headed</li>
                    <li>• Reduced motion shows full replies instantly</li>
                  </ul>
                </Reveal>
                <LandingAiChatDemo reducedMotion={reducedMotion} />
              </div>
            </div>
          </section>

          {/* Kanban showcase */}
          <section
            id="board"
            className="scroll-mt-24 border-t border-[var(--auth-border)]/50 px-6 py-20 md:px-10"
          >
            <div className="mx-auto max-w-6xl">
              <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
                <Reveal reducedMotion={reducedMotion} className="max-w-xl">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--auth-accent)]">
                    Through the lens
                  </p>
                  <h2 className="mt-4 text-3xl font-bold tracking-tight text-white md:text-4xl">
                    A kanban strip that could ship as product art
                  </h2>
                  <p className="mt-4 text-[var(--app-text-muted)]">
                    This stylized board matches your dark shell, green accent,
                    and card chrome — no stock photography, just UI truth with a
                    little drama.
                  </p>
                  <ul className="mt-8 space-y-3 text-sm text-zinc-400">
                    {[
                      "Drag cards between columns — real HTML5 drop targets",
                      "Lanes highlight on drag-over; cards lift on hover",
                      "Depth from borders, blur, and soft aurora wash",
                    ].map((item) => (
                      <motion.li
                        key={item}
                        initial={
                          reducedMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: -16 }
                        }
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, amount: 0.6 }}
                        transition={{ duration: 0.45, ease }}
                        className="flex gap-3"
                      >
                        <span
                          className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--auth-accent)]"
                          aria-hidden
                        />
                        {item}
                      </motion.li>
                    ))}
                  </ul>
                </Reveal>

                <motion.div
                  initial={
                    reducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }
                  }
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={viewport}
                  transition={{ duration: 0.75, ease }}
                >
                  <LandingKanbanPreview reducedMotion={reducedMotion} />
                </motion.div>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="px-6 py-20 md:px-10">
            <motion.div
              initial={
                reducedMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.98 }
              }
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={viewport}
              transition={{ duration: 0.7, ease }}
              className="mx-auto max-w-4xl overflow-hidden rounded-3xl border border-[var(--auth-border)] p-[1px]"
              style={{
                background:
                  "linear-gradient(135deg, var(--auth-accent), transparent 45%, var(--auth-accent))",
              }}
            >
              <div className="rounded-3xl bg-[var(--auth-card)] px-8 py-14 text-center md:px-16">
                <h2 className="text-3xl font-bold text-white md:text-4xl">
                  Ready when your next sprint is
                </h2>
                <p className="mx-auto mt-4 max-w-lg text-[var(--app-text-muted)]">
                  Log in to your workspace or create an account — the same auth
                  shell you already refined, now fronted by a page worth sharing.
                </p>
                <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Link
                    href="/register"
                    className="inline-flex h-12 items-center gap-2 rounded-xl bg-[var(--auth-accent)] px-8 text-base font-semibold text-white shadow-[0_0_28px_-6px_oklch(0.65_0.19_165_/0.55)] transition-[filter] hover:brightness-110"
                  >
                    Create account
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex h-12 items-center gap-2 rounded-xl border border-[var(--auth-border)] bg-[var(--auth-bg)] px-8 text-base font-semibold text-white transition-colors hover:border-[var(--auth-accent)]/35"
                  >
                    Sign in
                  </Link>
                </div>
              </div>
            </motion.div>
          </section>

          <footer className="border-t border-[var(--auth-border)]/50 px-6 py-10 text-center text-xs text-zinc-500 md:px-10">
            <p>© {new Date().getFullYear()} ScrumIQ · Ship better software with agile that actually works.</p>
          </footer>
        </main>
      </div>
    </div>
  );
}
