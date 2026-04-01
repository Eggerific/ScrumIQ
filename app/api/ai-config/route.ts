import { NextResponse } from "next/server";
import type { ScrumiqAiMode } from "@/lib/projects/ai-mode";
import { parseScrumiqAiMode } from "@/lib/projects/ai-mode";

/**
 * Exposes `SCRUMIQ_AI_MODE` to the client without a `NEXT_PUBLIC_*` duplicate.
 * Safe to call unauthenticated — values are not secrets.
 */
export async function GET() {
  const mode: ScrumiqAiMode = parseScrumiqAiMode(process.env.SCRUMIQ_AI_MODE);
  return NextResponse.json({ mode });
}
