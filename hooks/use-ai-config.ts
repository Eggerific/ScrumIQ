"use client";

import { useEffect, useState } from "react";
import type { ScrumiqAiMode } from "@/lib/projects/ai-mode";

type AiConfigState =
  | { status: "loading"; mode: null; error: null }
  | { status: "ready"; mode: ScrumiqAiMode; error: null }
  | { status: "error"; mode: null; error: string };

/**
 * Reads server `SCRUMIQ_AI_MODE` via `GET /api/ai-config` (single env var in `.env.local`).
 */
export function useAiConfig(): AiConfigState {
  const [state, setState] = useState<AiConfigState>({
    status: "loading",
    mode: null,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/ai-config");
        if (!res.ok) {
          throw new Error(`Request failed (${res.status})`);
        }
        const data = (await res.json()) as { mode?: unknown };
        if (cancelled) return;
        const mode =
          data.mode === "live" || data.mode === "mock" ? data.mode : "mock";
        setState({ status: "ready", mode, error: null });
      } catch {
        if (!cancelled) {
          setState({
            status: "error",
            mode: null,
            error: "Couldn’t read AI mode from the server.",
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
