"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import { ChevronDown, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProjectMember } from "@/components/projects/project-member";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface KanbanStoryAssigneeMenuProps {
  members: ProjectMember[];
  assignedTo: string | null;
  onPick: (userId: string | null) => void;
  compact?: boolean;
}

export function KanbanStoryAssigneeMenu({
  members,
  assignedTo,
  onPick,
  compact,
}: KanbanStoryAssigneeMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  /** List is portaled to `document.body`; must exclude it from “click outside” or mousedown closes before `onClick` runs. */
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [menuStyle, setMenuStyle] = useState<CSSProperties | null>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      const t = e.target as Node;
      if (rootRef.current?.contains(t)) return;
      if (menuRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  useLayoutEffect(() => {
    if (!open) {
      setMenuStyle(null);
      return;
    }
    const el = rootRef.current;
    if (!el) return;

    const update = () => {
      const r = el.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const margin = 10;
      const menuWidth = Math.min(340, vw - margin * 2);
      let left = r.right - menuWidth;
      left = Math.max(margin, Math.min(left, vw - menuWidth - margin));
      const spaceBelow = vh - r.bottom - margin;
      const spaceAbove = r.top - margin;
      const openDown = spaceBelow >= 160 || spaceBelow >= spaceAbove;
      const maxH = Math.min(320, openDown ? spaceBelow - 4 : spaceAbove - 4);
      if (openDown) {
        setMenuStyle({
          position: "fixed",
          top: r.bottom + 4,
          left,
          width: menuWidth,
          maxHeight: Math.max(120, maxH),
          zIndex: 300,
        });
      } else {
        setMenuStyle({
          position: "fixed",
          bottom: vh - r.top + 4,
          left,
          width: menuWidth,
          maxHeight: Math.max(120, maxH),
          zIndex: 300,
        });
      }
    };

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, members.length]);

  const current = members.find((m) => m.user_id === assignedTo) ?? null;
  const currentTitle = current?.full_name ?? "";

  const listbox =
    open && menuStyle ? (
      <div
        ref={menuRef}
        style={menuStyle}
        className="app-scrollbar overflow-y-auto overflow-x-hidden rounded-xl border border-[var(--app-sidebar-border)] bg-[var(--auth-card)] py-1 shadow-2xl"
        role="listbox"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className={cn(
            "flex w-full items-start gap-2.5 px-3 py-2.5 text-left text-sm text-zinc-400 hover:bg-[var(--app-nav-hover-bg)]",
            assignedTo === null && "bg-[var(--app-accent)]/10 text-zinc-200"
          )}
          onClick={() => {
            onPick(null);
            setOpen(false);
          }}
        >
          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-dashed border-zinc-600">
            <User className="h-3.5 w-3.5" aria-hidden />
          </div>
          <span className="min-w-0 flex-1 break-words leading-snug">Unassigned</span>
        </button>
        {members.map((m) => (
          <button
            key={m.user_id}
            type="button"
            className={cn(
              "flex w-full items-start gap-2.5 px-3 py-2.5 text-left text-sm hover:bg-[var(--app-nav-hover-bg)]",
              assignedTo === m.user_id && "bg-[var(--app-accent)]/10 text-zinc-100"
            )}
            onClick={() => {
              onPick(m.user_id);
              setOpen(false);
            }}
          >
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--app-accent)]/15 text-[10px] font-bold text-[var(--app-accent)]">
              {getInitials(m.full_name)}
            </div>
            <div className="min-w-0 flex-1 overflow-hidden text-left">
              <p className="break-words font-medium leading-snug">{m.full_name}</p>
              <p className="mt-0.5 break-all text-xs leading-snug text-zinc-500">{m.email}</p>
            </div>
          </button>
        ))}
      </div>
    ) : null;

  return (
    <div
      ref={rootRef}
      className={cn(
        "relative w-full",
        compact ? "min-w-0 max-w-full flex-1" : "max-w-md"
      )}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        title={currentTitle || "Choose assignee"}
        className={cn(
          "flex w-full min-w-0 items-center gap-2 rounded-lg border border-[var(--app-sidebar-border)] bg-[var(--background)]/40 px-2.5 py-1.5 text-left transition-colors hover:border-zinc-600 hover:bg-[var(--app-nav-hover-bg)]",
          compact ? "min-h-9" : "min-h-11"
        )}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        {current ? (
          <div
            className={cn(
              "flex shrink-0 items-center justify-center rounded-full bg-[var(--app-accent)]/20 font-bold text-[var(--app-accent)] ring-1 ring-[var(--app-accent)]/30",
              compact ? "h-7 w-7 text-[10px]" : "h-8 w-8 text-[10px]"
            )}
          >
            {getInitials(current.full_name)}
          </div>
        ) : (
          <div
            className={cn(
              "flex shrink-0 items-center justify-center rounded-full border border-dashed border-zinc-600 text-zinc-600",
              compact ? "h-7 w-7" : "h-8 w-8"
            )}
          >
            <User className={cn("shrink-0", compact ? "h-3.5 w-3.5" : "h-4 w-4")} aria-hidden />
          </div>
        )}
        <span
          className={cn(
            "min-w-0 flex-1 text-left font-semibold leading-snug text-zinc-100",
            compact ? "truncate text-base" : "line-clamp-2 break-words text-lg"
          )}
        >
          {current ? current.full_name : "Assign"}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-zinc-500 transition-transform",
            open && "rotate-180"
          )}
          aria-hidden
        />
      </button>

      {typeof document !== "undefined" && listbox
        ? createPortal(listbox, document.body)
        : null}
    </div>
  );
}
