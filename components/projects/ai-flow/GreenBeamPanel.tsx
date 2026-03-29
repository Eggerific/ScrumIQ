"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Green L-brackets — toned down so panels don’t compete with content. */
function CornerBeam() {
  const arm =
    "pointer-events-none absolute border-[var(--app-accent)]/55 opacity-40 transition-opacity duration-300";
  return (
    <>
      <span
        className={cn(
          arm,
          "left-4 top-4 h-9 w-9 origin-top-left rounded-tl-lg border-l-2 border-t-2 md:left-5 md:top-5"
        )}
        aria-hidden
      />
      <span
        className={cn(
          arm,
          "right-4 top-4 h-9 w-9 origin-top-right rounded-tr-lg border-r-2 border-t-2 md:right-5 md:top-5"
        )}
        aria-hidden
      />
      <span
        className={cn(
          arm,
          "bottom-4 left-4 h-9 w-9 origin-bottom-left rounded-bl-lg border-b-2 border-l-2 md:bottom-5 md:left-5"
        )}
        aria-hidden
      />
      <span
        className={cn(
          arm,
          "bottom-4 right-4 h-9 w-9 origin-bottom-right rounded-br-lg border-b-2 border-r-2 md:bottom-5 md:right-5"
        )}
        aria-hidden
      />
    </>
  );
}

export function GreenBeamPanel({
  children,
  className,
  paddingClassName = "p-6 md:p-8",
}: {
  children: ReactNode;
  className?: string;
  /** Override inner padding (content sits inside the beam). */
  paddingClassName?: string;
}) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border-2 border-[var(--app-accent)]/45 bg-[var(--auth-card)] shadow-[0_0_28px_-14px_oklch(0.65_0.19_165_/_0.22)]",
        className
      )}
    >
      <CornerBeam />
      <div className={cn("relative z-[1]", paddingClassName)}>{children}</div>
    </div>
  );
}
