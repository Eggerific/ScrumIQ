"use client";

import Link from "next/link";

/** Company logo mark (ScrumIQ icon) — 32×48 viewBox, theme accent color. */
export function ScrumIQLogoMark({ className }: { className?: string }) {
  return (
    <svg
      fill="none"
      height="48"
      viewBox="0 0 32 48"
      width="32"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <g fill="var(--app-accent)">
        <path d="m.599609 19.2002h9.59998v9.59999h-9.59998z" />
        <path
          d="m31.4004 28.7998h9.6v9.59999h-9.6z"
          transform="matrix(-1 0 -0 -1 62.8008 57.5996)"
        />
        <path d="m10.1992 19.2001 11.6-9.6v9.6l-11.6 9.6z" opacity=".2" />
        <path d="m21.7988 28.7999-11.6 9.6v-9.6l11.6-9.6z" opacity=".5" />
        <path d="m.599609 19.2 21.199991-19.2v9.59999l-11.6 9.60001z" opacity=".6" />
        <path d="m31.4004 28.8-21.2 19.2v-9.6l11.6-9.6z" opacity=".7" />
      </g>
    </svg>
  );
}

/** Logo mark + wordmark for the app shell. Company icon + "ScrumIQ". */
export function AppLogo() {
  return (
    <Link
      href="/dashboard"
      className="flex items-center gap-2.5 transition-opacity duration-200 hover:opacity-85 focus:outline-none focus:ring-2 focus:ring-[var(--app-accent)] focus:ring-offset-2 focus:ring-offset-[var(--app-sidebar-bg)] rounded-md"
      aria-label="ScrumIQ home"
    >
      <span className="h-9 w-9 shrink-0 [&_svg]:h-full [&_svg]:w-full">
        <ScrumIQLogoMark />
      </span>
      <span
        className="text-xl font-semibold tracking-tight"
        style={{ color: "var(--app-text-primary)" }}
      >
        Scrum<span style={{ color: "var(--app-logo-accent)" }}>IQ</span>
      </span>
    </Link>
  );
}
