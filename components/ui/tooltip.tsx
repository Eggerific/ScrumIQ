"use client";

import { Tooltip as TooltipPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

const Content = TooltipPrimitive.Content;
const Provider = TooltipPrimitive.Provider;
const Root = TooltipPrimitive.Root;
const Trigger = TooltipPrimitive.Trigger;
const Portal = TooltipPrimitive.Portal;

export function AppTooltip({
  children,
  content,
  side = "right",
  sideOffset = 8,
  contentClassName,
}: {
  children: React.ReactNode;
  content: React.ReactNode;
  side?: React.ComponentProps<typeof Content>["side"];
  sideOffset?: number;
  contentClassName?: string;
}) {
  return (
    <Root delayDuration={200}>
      <Trigger asChild>{children}</Trigger>
      <Portal>
        <Content
          side={side}
          sideOffset={sideOffset}
          className={cn(
            "z-[200] max-w-[min(18rem,calc(100vw-2rem))] rounded-lg border border-[var(--app-sidebar-border)] bg-[var(--auth-card)] px-3 py-2 text-left text-xs leading-snug text-zinc-200 shadow-xl",
            "animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
            contentClassName
          )}
        >
          {content}
        </Content>
      </Portal>
    </Root>
  );
}

export function AppTooltipProvider({
  children,
  delayDuration = 250,
}: {
  children: React.ReactNode;
  delayDuration?: number;
}) {
  return <Provider delayDuration={delayDuration}>{children}</Provider>;
}
