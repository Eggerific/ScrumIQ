"use client";

import { Select } from "radix-ui";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type AppSelectOption = { value: string; label: string };

export function AppSelect({
  value,
  onValueChange,
  options,
  disabled,
  "aria-label": ariaLabel,
  triggerClassName,
  contentClassName,
}: {
  value: string;
  onValueChange: (next: string) => void;
  options: AppSelectOption[];
  disabled?: boolean;
  "aria-label"?: string;
  triggerClassName?: string;
  contentClassName?: string;
}) {
  return (
    <Select.Root value={value} onValueChange={onValueChange} disabled={disabled}>
      <Select.Trigger
        aria-label={ariaLabel}
        className={cn(
          "flex h-9 w-full min-w-[10.5rem] shrink-0 items-center justify-between gap-2 rounded-lg border border-[var(--app-sidebar-border)] bg-[var(--background)]/50 px-3 py-2 text-left text-xs font-medium text-[var(--foreground)] outline-none transition-[border-color,box-shadow,background-color]",
          "hover:border-[var(--app-accent)]/30 hover:bg-[var(--app-nav-hover-bg)]/40",
          "focus-visible:border-[var(--app-accent)]/50 focus-visible:ring-2 focus-visible:ring-[var(--app-accent)]/25",
          "data-[state=open]:border-[var(--app-accent)]/45 data-[state=open]:ring-2 data-[state=open]:ring-[var(--app-accent)]/20",
          "disabled:cursor-not-allowed disabled:opacity-45",
          "[&>span]:truncate",
          triggerClassName
        )}
      >
        <Select.Value placeholder="Choose…" />
        <Select.Icon className="shrink-0 text-zinc-500">
          <ChevronDown className="h-3.5 w-3.5" aria-hidden />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content
          position="popper"
          sideOffset={6}
          align="start"
          collisionPadding={12}
          className={cn(
            "z-[220] max-h-[min(16rem,var(--radix-select-content-available-height))] w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl border border-[var(--app-sidebar-border)] bg-[var(--auth-card)] py-1 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.55)] backdrop-blur-sm",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-1 data-[side=top]:slide-in-from-bottom-1",
            contentClassName
          )}
        >
          <Select.Viewport className="p-1">
            {options.map((o) => (
              <Select.Item
                key={o.value}
                value={o.value}
                textValue={o.label}
                className={cn(
                  "relative flex cursor-pointer select-none items-center rounded-lg py-2.5 pl-9 pr-3 text-sm text-zinc-200 outline-none",
                  "data-[highlighted]:bg-[var(--app-nav-hover-bg)] data-[highlighted]:text-[var(--foreground)]",
                  "data-[state=checked]:bg-[var(--app-nav-active-bg)]/80 data-[state=checked]:text-[var(--app-accent)]"
                )}
              >
                <span className="absolute left-2.5 flex h-4 w-4 items-center justify-center text-[var(--app-accent)]">
                  <Select.ItemIndicator>
                    <Check className="h-3.5 w-3.5" aria-hidden />
                  </Select.ItemIndicator>
                </span>
                <Select.ItemText>{o.label}</Select.ItemText>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
