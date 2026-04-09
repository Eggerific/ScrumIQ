/**
 * Defaults tuned for **lower spend** (students, side projects) while keeping
 * structure that passes `enforceLiveBacklogDraftSafeguards`.
 *
 * - **Haiku** is much cheaper than Sonnet for typical input+output sizes.
 * - **Capped `max_tokens`** reduces worst-case output billing (prompt asks for a smaller tree).
 *
 * Override anytime:
 * - `ANTHROPIC_MODEL` — e.g. `claude-sonnet-4-20250514` when you need heavier reasoning.
 * - `ANTHROPIC_MAX_OUTPUT_TOKENS` — integer 2048–8192 (server only).
 */

export const BUDGET_DEFAULT_ANTHROPIC_MODEL = "claude-3-5-haiku-20241022";

/** Typical backlog JSON fits here; raises = more cost if the model fills the budget. */
export const BUDGET_DEFAULT_MAX_OUTPUT_TOKENS = 6_144;

const MIN_OUTPUT = 2_048;
const MAX_OUTPUT = 8_192;

export function resolveAnthropicMaxOutputTokens(): number {
  const raw = process.env.ANTHROPIC_MAX_OUTPUT_TOKENS?.trim();
  if (!raw) return BUDGET_DEFAULT_MAX_OUTPUT_TOKENS;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n)) return BUDGET_DEFAULT_MAX_OUTPUT_TOKENS;
  return Math.min(MAX_OUTPUT, Math.max(MIN_OUTPUT, n));
}
