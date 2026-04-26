import { cn } from "@/lib/utils";

/** Epic shells — purple #874e94, alternating depth (matches ArtifactReviewPanel). */
export const EPIC_SHELL = [
  "border-l-[3px] border-l-[#874e94] bg-gradient-to-br from-[#874e94]/26 via-zinc-900/28 to-zinc-950/92 shadow-[inset_0_1px_0_0_oklch(1_0_0_/_0.04)] ring-1 ring-[#874e94]/22",
  "border-l-[3px] border-l-[#874e94] bg-gradient-to-br from-[#874e94]/14 via-zinc-900/32 to-zinc-950/92 shadow-[inset_0_1px_0_0_oklch(1_0_0_/_0.04)] ring-1 ring-[#874e94]/14",
] as const;

export const EPIC_BADGE =
  "border-[#874e94]/45 bg-[#874e94]/18 text-[#e9c7ee]";

/** Task-style backlog field (matches BacklogArtifactsPanel / ArtifactReviewPanel). */
export const BACKLOG_TX_TASK =
  "min-h-[3rem] resize-y border-[#4a8fd4]/45 bg-[#4a8fd4]/12 text-sky-50 placeholder:text-sky-100/35 focus-visible:border-[#4a8fd4]/70 focus-visible:ring-[#4a8fd4]/22";

/** Acceptance-criteria field (matches backlog review palette). */
export const BACKLOG_TX_AC =
  "min-h-[3.25rem] resize-y border-[#c9a45c]/40 bg-[#c9a45c]/10 text-amber-50 placeholder:text-amber-100/40 focus-visible:border-[#c9a45c]/65 focus-visible:ring-[#c9a45c]/18";

/** Freeform story notes (Kanban / detail — neutral zinc, multi-line). */
export const BACKLOG_TX_NOTES =
  "min-h-[5rem] resize-y border-zinc-600/45 bg-zinc-900/35 text-zinc-200 placeholder:text-zinc-500 focus-visible:border-zinc-500/70 focus-visible:ring-zinc-500/20";

/** Read-only story card — same family as editable review cards. */
export const STORY_CARD_CLASS =
  "border border-[var(--app-accent)]/35 bg-[color-mix(in_oklch,var(--app-accent),transparent_92%)] shadow-sm ring-1 ring-[var(--app-accent)]/12";

export function epicShellClass(epicIndex: number): string {
  return cn(
    "overflow-hidden rounded-2xl border border-zinc-600/20 !border-b-0 last:!border-b-0",
    EPIC_SHELL[epicIndex % EPIC_SHELL.length]!
  );
}
