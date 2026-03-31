"use client";

import { useId } from "react";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

/** Small helper icon with hover/focus tooltip; no extra dependencies. */
export function InfoTooltip({ text }: { text: string }) {
  const tipId = useId();
  return (
    <span className="group/tooltip relative inline-flex align-middle">
      <button
        type="button"
        tabIndex={0}
        className={cn(
          "ml-1 inline-flex shrink-0 rounded p-0.5 text-[var(--app-text-muted)] outline-none",
          "transition-colors hover:text-[var(--app-accent)]",
          "focus-visible:ring-2 focus-visible:ring-[var(--app-accent)]/50"
        )}
        aria-describedby={tipId}
      >
        <Info className="h-4 w-4" aria-hidden />
      </button>
      <span
        id={tipId}
        role="tooltip"
        className={cn(
          "pointer-events-none absolute left-1/2 top-full z-[60] mt-2 w-[min(18rem,calc(100vw-2rem))] -translate-x-1/2",
          "rounded-lg border border-[var(--app-sidebar-border)] bg-[var(--auth-card)] px-3 py-2",
          "text-left text-sm font-normal leading-snug text-zinc-200 shadow-lg",
          "opacity-0 transition-opacity duration-150",
          "invisible group-hover/tooltip:visible group-hover/tooltip:opacity-100",
          "group-focus-within/tooltip:visible group-focus-within/tooltip:opacity-100"
        )}
      >
        {text}
      </span>
    </span>
  );
}
