"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Plus } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ExpandableBacklogText({
  value,
  onChange,
  rows = 3,
  textareaClassName,
  emptyHint = "Empty — click + to edit",
  keyboardHint = true,
  "aria-label": ariaLabel,
}: {
  value: string;
  onChange: (next: string) => void;
  rows?: number;
  textareaClassName: string;
  emptyHint?: string;
  /** Show “Enter to finish · Ctrl+Enter new line” under the field while editing. */
  keyboardHint?: boolean;
  "aria-label"?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [showSavedFlash, setShowSavedFlash] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const hasText = value.trim().length > 0;

  useEffect(() => {
    if (!showSavedFlash) return;
    const t = window.setTimeout(() => setShowSavedFlash(false), 2000);
    return () => window.clearTimeout(t);
  }, [showSavedFlash]);

  const finishEditing = () => {
    setEditing(false);
    setShowSavedFlash(true);
  };

  if (editing) {
    return (
      <div className="w-full min-w-0 space-y-1.5">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => finishEditing()}
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            const isNewLine = e.ctrlKey || e.metaKey;
            if (isNewLine) {
              e.preventDefault();
              const el = e.currentTarget;
              const start = el.selectionStart ?? 0;
              const end = el.selectionEnd ?? 0;
              const next = `${value.slice(0, start)}\n${value.slice(end)}`;
              onChange(next);
              const pos = start + 1;
              requestAnimationFrame(() => {
                const node = textareaRef.current;
                if (node) {
                  node.selectionStart = pos;
                  node.selectionEnd = pos;
                }
              });
              return;
            }
            e.preventDefault();
            e.currentTarget.blur();
          }}
          rows={rows}
          className={cn("min-w-0 w-full", textareaClassName)}
          autoFocus
          aria-label={ariaLabel}
        />
        {keyboardHint ? (
          <p className="text-[11px] leading-snug text-zinc-500">
            <kbd className="rounded border border-zinc-600/60 bg-zinc-900/80 px-1 py-px font-mono text-[10px] text-zinc-400">
              Enter
            </kbd>{" "}
            to finish editing ·{" "}
            <kbd className="rounded border border-zinc-600/60 bg-zinc-900/80 px-1 py-px font-mono text-[10px] text-zinc-400">
              Ctrl
            </kbd>
            +
            <kbd className="rounded border border-zinc-600/60 bg-zinc-900/80 px-1 py-px font-mono text-[10px] text-zinc-400">
              Enter
            </kbd>{" "}
            for a new line (⌘+Enter on Mac)
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 space-y-1.5">
      <div className="flex w-full min-w-0 items-start gap-2">
        <p
          className={cn(
            "min-w-0 flex-1 whitespace-pre-wrap pt-0.5 text-sm leading-relaxed",
            hasText ? "text-zinc-300" : "italic text-zinc-500"
          )}
        >
          {hasText ? value : emptyHint}
        </p>
        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="h-7 w-7 text-muted-foreground hover:text-[var(--app-accent)]"
            aria-label={ariaLabel ? `Edit: ${ariaLabel}` : "Edit"}
            onClick={() => {
              setShowSavedFlash(false);
              setEditing(true);
            }}
          >
            <Plus className="size-4" aria-hidden />
          </Button>
        </span>
      </div>
      {showSavedFlash ? (
        <p
          className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--app-accent)]/95"
          role="status"
          aria-live="polite"
        >
          <Check className="size-3.5 shrink-0 stroke-[2.5]" aria-hidden />
          Saved in this session
        </p>
      ) : null}
    </div>
  );
}
