"use client";

import { motion } from "framer-motion";
import { Bot, Sparkles, User } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const ease = [0.25, 0.1, 0.25, 1] as const;

/** Scripted landing demos — real product will map to brief → structured epics/stories. */
const SUGGESTIONS = [
  {
    label: "Draft epics",
    prompt:
      "From our brief: we’re hardening merchant payouts and making failures visible to ops. Propose three epics with a tight narrative under each.",
    reply: `Here are three epics you could create at the top of the backlog:

Epic — Reliable payouts
Ensure settlement paths, webhooks, and reconciliation are trustworthy so finance never discovers issues second-hand.

Epic — Operator observability
Give support and on-call a single place to see failures, retries, queues, and customer impact — cut mean time to clue.

Epic — Safe rollout & rollback
Ship behind flags, rehearse rollback, and keep customer-visible downtime at zero while we iterate.

I’ve ordered them so observability can feed the first hardening milestones; tweak names to match your taxonomy.`,
  },
  {
    label: "User stories",
    prompt:
      "Under epic “Reliable payouts”, write three user stories with a one-line acceptance hint each. Use classic scrum wording.",
    reply: `Under Reliable payouts, here’s a groomable slice:

1) As a merchant, I want webhook deliveries to be idempotent with a dedup ledger so that duplicate events never double-settle.
   Acceptance: replay suite + idempotency key contract documented in the API guide.

2) As a finance analyst, I want a date-range reconciliation export so that month-close doesn’t rely on ad-hoc CSV pulls.
   Acceptance: totals match the ledger within one cent on golden fixture data.

3) As an on-call engineer, I want dead-letter depth and oldest-age in the dashboard so that failed payouts surface before SLAs burn.
   Acceptance: metric + alert with runbook link; paging only on sustained breach.

Draft points: 5 · 3 · 5 — adjust after team sizing.`,
  },
  {
    label: "Epic → stories",
    prompt:
      "Break “Operator observability” into one epic blurb plus four child stories (title only + one-line value).",
    reply: `Epic — Operator observability
One measurable pane for queues, errors, retries, and customer blast radius so incidents shrink from hours to minutes.

Child stories
• Trace IDs end-to-end — Support jumps from ticket → correlated traces without SSH.
• Queue depth & age — Visualize backlog pressure before consumers stall.
• Synthetic payout probe — Hourly canary catches regressions before merchants do.
• Runbook in product — Every alert links to steps, owners, and escalation.

These nest under the epic for roadmap and sprint planning; scrum masters can pull them straight into the board.`,
  },
] as const;

type Msg = { role: "user" | "assistant"; text: string };

export function LandingAiChatDemo({
  reducedMotion,
}: {
  reducedMotion: boolean;
}) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [busy, setBusy] = useState(false);
  const streamRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (streamRef.current) clearInterval(streamRef.current);
    };
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: reducedMotion ? "auto" : "smooth",
    });
  }, [messages, reducedMotion]);

  const runSuggestion = useCallback(
    (s: (typeof SUGGESTIONS)[number]) => {
      if (busy) return;
      setBusy(true);
      setMessages((m) => [...m, { role: "user", text: s.prompt }]);

      if (reducedMotion) {
        setMessages((m) => [...m, { role: "assistant", text: s.reply }]);
        setBusy(false);
        return;
      }

      setMessages((m) => [...m, { role: "assistant", text: "" }]);

      let i = 0;
      const full = s.reply;
      if (streamRef.current) clearInterval(streamRef.current);
      streamRef.current = setInterval(() => {
        i = Math.min(i + 2, full.length);
        setMessages((m) => {
          const next = [...m];
          const last = next[next.length - 1];
          if (!last || last.role !== "assistant") return next;
          next[next.length - 1] = {
            role: "assistant",
            text: full.slice(0, i),
          };
          return next;
        });
        if (i >= full.length) {
          if (streamRef.current) clearInterval(streamRef.current);
          streamRef.current = null;
          setBusy(false);
        }
      }, 14);
    },
    [busy, reducedMotion]
  );

  return (
    <motion.div
      initial={
        reducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 32 }
      }
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25, margin: "-40px" }}
      transition={{ duration: 0.65, ease }}
      className={cn(
        "overflow-hidden rounded-2xl border border-[var(--auth-border)] bg-[var(--auth-card)]/95 shadow-[0_24px_70px_-28px_rgba(0,0,0,0.65)] backdrop-blur-md",
        "transition-shadow duration-300 hover:shadow-[0_0_0_1px_oklch(0.65_0.19_165_/0.35),0_28px_80px_-24px_rgba(0,0,0,0.55)]"
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-[var(--auth-border)] px-4 py-3 md:px-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--auth-accent)]/15 text-[var(--auth-accent)]">
            <Bot className="h-4 w-4" aria-hidden />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">ScrumIQ assistant</p>
            <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-zinc-500">
              Epics & stories · scripted demo
            </p>
          </div>
        </div>
        <span className="hidden items-center gap-1 rounded-full border border-[var(--auth-accent)]/35 bg-[var(--auth-accent)]/10 px-2 py-1 text-[10px] font-semibold text-[var(--auth-accent)] sm:inline-flex">
          <Sparkles className="h-3 w-3 motion-safe:animate-pulse" aria-hidden />
          Sample output
        </span>
      </div>

      <div
        ref={listRef}
        className="scrollbar-thin max-h-[280px] space-y-3 overflow-y-auto px-4 py-4 md:max-h-[320px] md:px-5"
        role="log"
        aria-live="polite"
        aria-relevant="additions"
      >
        {messages.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-zinc-500">
            Try a chip to preview how ScrumIQ could expand a brief into epics
            and user stories — same shell as the app; no API call on this page.
          </p>
        ) : null}
        {messages.map((msg, idx) => (
          <div
            key={`landing-msg-${idx}`}
            className={cn(
              "flex gap-2",
              msg.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            {msg.role === "assistant" ? (
              <span
                className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--auth-bg)] text-[var(--auth-accent)]"
                aria-hidden
              >
                <Sparkles className="h-3.5 w-3.5" />
              </span>
            ) : null}
            <div
              className={cn(
                "max-w-[92%] rounded-xl px-3 py-2 text-sm leading-relaxed",
                msg.role === "user"
                  ? "bg-[var(--auth-accent)]/20 text-zinc-100"
                  : "whitespace-pre-wrap border border-[var(--auth-border)] bg-[var(--auth-bg)] text-zinc-300"
              )}
            >
              {msg.role === "user" ? (
                <span className="flex items-start gap-2">
                  <User className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-70" />
                  {msg.text}
                </span>
              ) : (
                msg.text || (
                  <span className="inline-flex gap-1 text-zinc-500">
                    <span className="motion-safe:animate-pulse">Thinking</span>
                    <span className="tabular-nums">…</span>
                  </span>
                )
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-[var(--auth-border)] bg-[var(--auth-bg)]/50 px-4 py-3 md:px-5">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
          Try a backlog prompt
        </p>
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s.label}
              type="button"
              disabled={busy}
              onClick={() => runSuggestion(s)}
              className={cn(
                "rounded-lg border border-[var(--auth-border)] bg-[var(--auth-card)] px-3 py-1.5 text-left text-xs font-medium text-zinc-300 transition-[border-color,background-color,transform,color]",
                "hover:border-[var(--auth-accent)]/45 hover:text-white",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--auth-accent)]",
                "disabled:pointer-events-none disabled:opacity-45",
                "active:scale-[0.98]"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
        <p className="mt-3 text-[10px] text-zinc-600">
          Script only — in-app AI will use your project brief and return
          structured epics, stories, and themes.
        </p>
      </div>
    </motion.div>
  );
}
