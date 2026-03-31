"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ExpandableBacklogText({
  value,
  onChange,
  rows = 3,
  textareaClassName,
  emptyHint = "Empty — click + to edit",
  "aria-label": ariaLabel,
}: {
  value: string;
  onChange: (next: string) => void;
  rows?: number;
  textareaClassName: string;
  emptyHint?: string;
  "aria-label"?: string;
}) {
  const [editing, setEditing] = useState(false);
  const hasText = value.trim().length > 0;

  if (editing) {
    return (
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => setEditing(false)}
        rows={rows}
        className={cn("min-w-0 w-full", textareaClassName)}
        autoFocus
        aria-label={ariaLabel}
      />
    );
  }

  return (
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
          onClick={() => setEditing(true)}
        >
          <Plus className="size-4" aria-hidden />
        </Button>
      </span>
    </div>
  );
}
