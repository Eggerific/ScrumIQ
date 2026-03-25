"use client";

import { DotLottie } from "@lottiefiles/dotlottie-web";
import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, LogIn, UserPlus } from "lucide-react";
import { ScrumIQLogoMark } from "@/components/app/AppLogo";
import { cn } from "@/lib/utils";

const LOTTIE_WELCOME_SRC =
  "https://lottie.host/d558382c-f948-46c0-bbd6-f1ca2e53f9d9/DbXafwTplB.lottie";

/** Shared auth card with Lottie left panel — used by (auth) layout so Lottie never unmounts between login/register */
export function AuthCardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background font-[family-name:var(--font-lato)]">
      <div
        className="absolute inset-0 bg-[length:200%_200%] animate-gradient-shift"
        style={{ backgroundImage: "var(--gradient-auth)" }}
      />
      <div className="relative z-10 flex min-h-screen items-center justify-center p-4 md:p-6">
        <div
          className="w-full max-w-4xl rounded-2xl p-[1px]"
          style={{
            background:
              "linear-gradient(135deg, var(--auth-accent), transparent 50%, var(--auth-accent))",
            boxShadow:
              "0 0 32px -4px oklch(0.65 0.19 165 / 0.4), 0 0 64px -8px oklch(0.65 0.19 165 / 0.2)",
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.6,
              ease: [0.25, 0.1, 0.25, 1],
            }}
            className="flex h-[640px] flex-col overflow-hidden rounded-2xl border border-[var(--auth-border)] bg-[var(--auth-card)] shadow-2xl md:h-[720px] md:flex-row"
          >
            {/* Left panel — Lottie (stays mounted when children switch between login/register) */}
            <div className="relative flex min-h-[220px] flex-1 flex-col bg-gradient-to-br from-[var(--auth-bg)] via-oklch(0.2 0.03 165) to-[var(--auth-bg)] p-6 pt-8 md:min-h-0 md:p-8 md:pt-10">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_50%,var(--auth-accent)_0%,transparent_60%)] opacity-20" />
              <div className="relative z-10 flex shrink-0 flex-col items-center text-center">
                <WelcomeHero />
              </div>
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  duration: 0.5,
                  delay: 0.35,
                  ease: [0.25, 0.1, 0.25, 1],
                }}
                className="relative z-10 flex min-h-0 flex-1 items-center justify-center"
              >
                <LottieWithFallback />
              </motion.div>
            </div>

            {/* Right panel — fixed height so login/register don't resize card; tab switcher + form */}
            <div className="auth-form-panel flex min-h-0 flex-1 flex-col items-stretch overflow-hidden">
              <div className="shrink-0 px-6 pt-6 md:px-10 md:pt-10">
                <Link
                  href="/"
                  className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-zinc-400 transition-colors hover:text-white"
                >
                  <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
                  Back to home
                </Link>
                <AuthTabSwitcher pathname={pathname} />
              </div>
              <div className="min-h-0 flex-1 overflow-hidden">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={pathname}
                    initial={{ x: 48, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -48, opacity: 0 }}
                    transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
                    className="flex h-full min-w-0 flex-1 flex-col items-stretch overflow-hidden"
                  >
                    {children}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

/** Tab switcher with sliding pill — Login / Sign Up; lives in shell so pill animates on route change */
function AuthTabSwitcher({ pathname }: { pathname: string }) {
  const isLogin = pathname === "/login";
  return (
    <div className="mb-6 flex gap-1 rounded-lg bg-[var(--auth-bg)] p-1">
      <Link
        href="/login"
        className={cn(
          "relative z-10 flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
          isLogin ? "text-white" : "text-zinc-400 hover:text-white"
        )}
      >
        {isLogin && (
          <motion.div
            layoutId="auth-tab-pill"
            className="absolute inset-0 rounded-lg bg-[var(--auth-accent)]"
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
        )}
        <span className="relative z-10 flex items-center gap-2">
          <LogIn className="h-4 w-4" />
          Login
        </span>
      </Link>
      <Link
        href="/register"
        className={cn(
          "relative z-10 flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
          !isLogin ? "text-white" : "text-zinc-400 hover:text-white"
        )}
      >
        {!isLogin && (
          <motion.div
            layoutId="auth-tab-pill"
            className="absolute inset-0 rounded-lg bg-[var(--auth-accent)]"
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
        )}
        <span className="relative z-10 flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Sign Up
        </span>
      </Link>
    </div>
  );
}

/** Error boundary: on Lottie load error, show static illustration */
class LottieErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: {
    children: React.ReactNode;
    fallback: React.ReactNode;
  }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch() {
    // Suppress "Failed to load animation with id:" from dotlottie
  }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

function LottieWithFallback() {
  const [useFallback, setUseFallback] = useState(false);
  const handleLoadError = useCallback(() => {
    setUseFallback(true);
  }, []);

  useEffect(() => {
    const handler = (e: ErrorEvent) => {
      const msg = e?.message ?? "";
      if (
        msg.includes("Failed to load animation") ||
        msg.includes("animation with id") ||
        (msg.includes("animation") && msg.toLowerCase().includes("load"))
      ) {
        setUseFallback(true);
      }
    };
    window.addEventListener("error", handler);
    return () => window.removeEventListener("error", handler);
  }, []);

  if (useFallback) return <WelcomeIllustration />;

  return (
    <LottieErrorBoundary fallback={<WelcomeIllustration />}>
      <div className="h-full max-h-[280px] w-full max-w-[320px] md:max-h-[360px] md:max-w-[380px] [&_canvas]:max-h-[280px] [&_canvas]:md:max-h-[360px]">
        <WelcomeDotLottieCanvas onLoadError={handleLoadError} />
      </div>
    </LottieErrorBoundary>
  );
}

/**
 * Imperative DotLottie (not dotlottie-react): the React wrapper fires loadAnimation
 * in an effect that races with async load({ src }), which breaks remote .lottie files.
 */
function WelcomeDotLottieCanvas({ onLoadError }: { onLoadError: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const player = new DotLottie({
      canvas,
      src: LOTTIE_WELCOME_SRC,
      loop: true,
      autoplay: true,
      renderConfig: { autoResize: true },
    });

    player.addEventListener("loadError", onLoadError);

    return () => {
      player.removeEventListener("loadError", onLoadError);
      player.destroy();
    };
  }, [onLoadError]);

  return (
    <canvas
      ref={canvasRef}
      className="block h-full w-full"
      style={{ width: "100%", height: "100%", maxHeight: "inherit" }}
    />
  );
}

function WelcomeHero() {
  return (
    <>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.5,
          delay: 0.08,
          ease: [0.25, 0.1, 0.25, 1],
        }}
        className="text-lg font-medium tracking-wide text-white/90 md:text-xl"
      >
        Welcome to
      </motion.p>
      <motion.h2
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.5,
          delay: 0.18,
          ease: [0.25, 0.1, 0.25, 1],
        }}
        className="mt-2 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[var(--auth-border)] bg-[var(--auth-card)]/80 shadow-[0_0_24px_-8px_oklch(0.65_0.19_165_/0.35)] sm:h-12 sm:w-12 [&_svg]:h-full [&_svg]:w-full">
          <ScrumIQLogoMark aria-hidden />
        </span>
        <span className="bg-gradient-to-r from-white via-white to-[var(--auth-accent)] bg-clip-text text-3xl font-bold tracking-tight text-transparent md:text-4xl lg:text-5xl">
          ScrumIQ
        </span>
      </motion.h2>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.45, delay: 0.3, ease: "easeOut" }}
        className="mt-3 max-w-[260px] text-sm text-zinc-400 md:text-base"
      >
        Ship better software with agile that actually works.
      </motion.p>
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{
          duration: 0.5,
          delay: 0.42,
          ease: [0.25, 0.1, 0.25, 1],
        }}
        className="mx-auto mt-3 h-px w-24 bg-gradient-to-r from-transparent via-[var(--auth-accent)] to-transparent"
      />
    </>
  );
}

function WelcomeIllustration() {
  return (
    <svg
      viewBox="0 0 400 320"
      className="h-full max-h-[280px] w-full max-w-[320px] md:max-h-[360px] md:max-w-[380px]"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient
          id="welcome-screen-glow"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop
            offset="0%"
            stopColor="var(--auth-accent)"
            stopOpacity="0.15"
          />
          <stop offset="100%" stopColor="var(--auth-accent)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="welcome-base" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="oklch(0.25 0.02 260)" />
          <stop offset="100%" stopColor="oklch(0.32 0.03 260)" />
        </linearGradient>
      </defs>
      <g transform="translate(100 160) skewX(-28) skewY(0)">
        <path
          d="M0 70 L180 70 L180 92 L0 92 Z"
          fill="url(#welcome-base)"
          stroke="var(--auth-border)"
          strokeWidth="1"
        />
        <path
          d="M0 70 L24 44 L204 44 L180 70 Z"
          fill="oklch(0.22 0.02 260)"
          stroke="var(--auth-border)"
          strokeWidth="1"
        />
      </g>
      <rect
        x="124"
        y="52"
        width="200"
        height="108"
        rx="6"
        fill="oklch(0.12 0.01 260)"
        stroke="var(--auth-border)"
        strokeWidth="2"
      />
      <rect
        x="132"
        y="60"
        width="184"
        height="92"
        rx="4"
        fill="url(#welcome-screen-glow)"
        stroke="var(--auth-accent)"
        strokeOpacity="0.35"
        strokeWidth="1"
      />
      <g transform="translate(152 78)">
        <rect
          x="0"
          y="42"
          width="28"
          height="38"
          rx="2"
          fill="var(--auth-accent)"
          opacity="0.85"
        />
        <rect
          x="40"
          y="28"
          width="28"
          height="52"
          rx="2"
          fill="var(--auth-accent)"
          opacity="0.9"
        />
        <rect
          x="80"
          y="35"
          width="28"
          height="45"
          rx="2"
          fill="var(--auth-accent)"
          opacity="0.75"
        />
        <rect
          x="120"
          y="18"
          width="28"
          height="62"
          rx="2"
          fill="var(--auth-accent)"
          opacity="1"
        />
        <rect
          x="160"
          y="32"
          width="28"
          height="48"
          rx="2"
          fill="var(--auth-accent)"
          opacity="0.8"
        />
      </g>
      <path
        d="M 160 115 Q 200 98 240 108 T 324 95"
        stroke="var(--auth-accent)"
        strokeWidth="2"
        strokeOpacity="0.5"
        fill="none"
      />
      <circle
        cx="320"
        cy="75"
        r="18"
        fill="var(--auth-accent)"
        opacity="0.18"
      />
      <rect
        x="268"
        y="135"
        width="72"
        height="36"
        rx="6"
        fill="oklch(0.18 0.02 260)"
        stroke="var(--auth-border)"
        strokeWidth="1"
      />
      <rect
        x="280"
        y="147"
        width="20"
        height="12"
        rx="2"
        fill="var(--auth-accent)"
        opacity="0.45"
      />
    </svg>
  );
}
