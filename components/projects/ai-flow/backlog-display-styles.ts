import { cn } from "@/lib/utils";

/** Epic shells — purple #874e94, alternating depth (matches ArtifactReviewPanel). */
export const EPIC_SHELL = [
  "border-l-[3px] border-l-[#874e94] bg-gradient-to-br from-[#874e94]/26 via-zinc-900/28 to-zinc-950/92 shadow-[inset_0_1px_0_0_oklch(1_0_0_/_0.04)] ring-1 ring-[#874e94]/22",
  "border-l-[3px] border-l-[#874e94] bg-gradient-to-br from-[#874e94]/14 via-zinc-900/32 to-zinc-950/92 shadow-[inset_0_1px_0_0_oklch(1_0_0_/_0.04)] ring-1 ring-[#874e94]/14",
] as const;

export const EPIC_BADGE =
  "border-[#874e94]/45 bg-[#874e94]/18 text-[#e9c7ee]";

/** Read-only story card — same family as editable review cards. */
export const STORY_CARD_CLASS =
  "border border-[var(--app-accent)]/35 bg-[color-mix(in_oklch,var(--app-accent),transparent_92%)] shadow-sm ring-1 ring-[var(--app-accent)]/12";

export function epicShellClass(epicIndex: number): string {
  return cn(
    "overflow-hidden rounded-2xl border border-zinc-600/20 !border-b-0 last:!border-b-0",
    EPIC_SHELL[epicIndex % EPIC_SHELL.length]!
  );
}
