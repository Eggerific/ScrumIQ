/**
 * Parsing helpers for `SCRUMIQ_AI_MODE` (read `process.env` only on the server).
 * Types are safe to import in client code; call `parseScrumiqAiMode` on the server
 * or use `GET /api/ai-config` in the browser.
 */
export type ScrumiqAiMode = "mock" | "live";

export function parseScrumiqAiMode(
  raw: string | undefined
): ScrumiqAiMode {
  const m = raw?.toLowerCase().trim();
  if (m === "live") return "live";
  return "mock";
}

export function isMockAiMode(raw: string | undefined): boolean {
  return parseScrumiqAiMode(raw) === "mock";
}
