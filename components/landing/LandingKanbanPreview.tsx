"use client";

import { motion } from "framer-motion";
import { GripVertical } from "lucide-react";
import { useCallback, useState, type DragEvent } from "react";
import { cn } from "@/lib/utils";

const ease = [0.25, 0.1, 0.25, 1] as const;

type ColId = "backlog" | "progress" | "done";

type KanbanCard = {
  id: string;
  title: string;
  tag: string;
  points: string;
};

type ColumnDef = {
  id: ColId;
  title: string;
  subtitle: string;
  accent: string;
};

const COLUMN_DEFS: ColumnDef[] = [
  {
    id: "backlog",
    title: "Backlog",
    subtitle: "Ready to pull",
    accent: "oklch(0.55 0.12 260)",
  },
  {
    id: "progress",
    title: "In progress",
    subtitle: "Sprint focus",
    accent: "var(--auth-accent)",
  },
  {
    id: "done",
    title: "Done",
    subtitle: "Shipped",
    accent: "oklch(0.65 0.14 145)",
  },
];

const INITIAL_BOARD: Record<ColId, KanbanCard[]> = {
  backlog: [
    {
      id: "c1",
      title: "Payment webhooks hardening",
      tag: "Backend",
      points: "5",
    },
    {
      id: "c2",
      title: "Empty state illustrations",
      tag: "Design",
      points: "2",
    },
  ],
  progress: [
    { id: "c3", title: "Sprint IQ board polish", tag: "Frontend", points: "3" },
    { id: "c4", title: "AI brief generator", tag: "AI", points: "8" },
  ],
  done: [{ id: "c5", title: "Workspace project cap", tag: "Core", points: "3" }],
};

function moveCard(
  board: Record<ColId, KanbanCard[]>,
  cardId: string,
  from: ColId,
  to: ColId
): Record<ColId, KanbanCard[]> {
  if (from === to) return board;
  const card = board[from].find((c) => c.id === cardId);
  if (!card) return board;
  return {
    ...board,
    [from]: board[from].filter((c) => c.id !== cardId),
    [to]: [...board[to], card],
  };
}

export function LandingKanbanPreview({
  reducedMotion,
}: {
  reducedMotion: boolean;
}) {
  const [board, setBoard] = useState<Record<ColId, KanbanCard[]>>(INITIAL_BOARD);
  const [dragOver, setDragOver] = useState<ColId | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const onDrop = useCallback((e: DragEvent<HTMLDivElement>, colId: ColId) => {
    e.preventDefault();
    setDragOver(null);
    const raw = e.dataTransfer.getData("application/scrumiq-kanban");
    if (!raw) return;
    try {
      const { cardId, from } = JSON.parse(raw) as {
        cardId: string;
        from: ColId;
      };
      if (from && cardId) {
        setBoard((b) => moveCard(b, cardId, from, colId));
      }
    } catch {
      /* ignore */
    }
    setDraggingId(null);
  }, []);

  const hoverLift = reducedMotion ? {} : { y: -4, transition: { duration: 0.2, ease } };

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-[var(--auth-border)] bg-[var(--auth-card)]/95 p-4 shadow-[0_24px_80px_-24px_rgba(0,0,0,0.65)] backdrop-blur-md transition-[box-shadow] duration-300 hover:shadow-[0_0_0_1px_oklch(0.65_0.19_165_/0.22),0_32px_100px_-32px_rgba(0,0,0,0.75)] md:p-5"
      style={{
        boxShadow:
          "0 0 0 1px oklch(0.65 0.19 165 / 0.12), 0 32px 100px -32px rgba(0,0,0,0.75)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(oklch(0.92 0.01 260) 1px, transparent 1px), linear-gradient(90deg, oklch(0.92 0.01 260) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
        aria-hidden
      />
      <div className="mb-4 flex items-center justify-between gap-3 border-b border-[var(--auth-border)] pb-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Sprint view
          </p>
          <p className="text-sm font-semibold text-white">Q1 · Delivery board</p>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <div className="flex items-center gap-2 rounded-lg bg-[var(--auth-bg)] px-2 py-1 text-[10px] text-zinc-400">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: "var(--auth-accent)" }}
              aria-hidden
            />
            Interactive demo
          </div>
          <span className="hidden text-[9px] text-zinc-600 sm:block">
            Drag cards between columns
          </span>
        </div>
      </div>

      <div className="relative grid grid-cols-1 gap-3 sm:grid-cols-3">
        {COLUMN_DEFS.map((col, colIndex) => (
          <motion.div
            key={col.id}
            initial={
              reducedMotion
                ? { opacity: 1, y: 0, filter: "blur(0px)" }
                : { opacity: 0, y: 28, filter: "blur(8px)" }
            }
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, amount: 0.2, margin: "-40px 0px" }}
            transition={{
              duration: 0.65,
              delay: colIndex * 0.12,
              ease,
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              setDragOver(col.id);
            }}
            onDrop={(e) => onDrop(e, col.id)}
            className={cn(
              "flex min-h-[200px] flex-col rounded-xl border bg-[var(--auth-bg)]/80 p-3 transition-[border-color,background-color,box-shadow] duration-200",
              dragOver === col.id
                ? "border-[var(--auth-accent)]/55 bg-[var(--auth-accent)]/[0.07] shadow-[inset_0_0_0_1px_oklch(0.65_0.19_165_/0.25)]"
                : "border-[var(--auth-border)]"
            )}
          >
            <div className="mb-3 flex items-start justify-between gap-2">
              <div>
                <p
                  className="text-xs font-semibold text-white"
                  style={{ borderLeft: `3px solid ${col.accent}`, paddingLeft: 8 }}
                >
                  {col.title}
                </p>
                <p className="mt-0.5 text-[10px] text-zinc-500">{col.subtitle}</p>
              </div>
              <GripVertical
                className="h-4 w-4 shrink-0 text-zinc-600"
                aria-hidden
              />
            </div>
            <div className="flex flex-1 flex-col gap-2">
              {board[col.id].map((card, i) => (
                <motion.div
                  key={card.id}
                  layout={!reducedMotion}
                  initial={
                    reducedMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: -12 }
                  }
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{
                    duration: 0.45,
                    delay: colIndex * 0.12 + 0.15 + i * 0.08,
                    ease,
                    layout: { duration: 0.35, ease },
                  }}
                  whileHover={hoverLift}
                >
                  <div
                    draggable
                    onDragStart={(e: DragEvent<HTMLDivElement>) => {
                      setDraggingId(card.id);
                      e.dataTransfer.effectAllowed = "move";
                      e.dataTransfer.setData(
                        "application/scrumiq-kanban",
                        JSON.stringify({ cardId: card.id, from: col.id })
                      );
                    }}
                    onDragEnd={() => {
                      setDraggingId(null);
                      setDragOver(null);
                    }}
                    className={cn(
                      "cursor-grab rounded-lg border border-[var(--auth-border)] bg-[var(--auth-card)] p-2.5 shadow-sm transition-[border-color,box-shadow] active:cursor-grabbing",
                      "hover:border-[var(--auth-accent)]/35 hover:shadow-[0_0_20px_-8px_oklch(0.65_0.19_165_/0.35)]",
                      draggingId === card.id && "opacity-60"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-left text-xs font-medium leading-snug text-zinc-200">
                        {card.title}
                      </p>
                      <span className="shrink-0 rounded bg-[var(--auth-accent)]/15 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-[var(--auth-accent)]">
                        {card.points} pt
                      </span>
                    </div>
                    <p className="mt-2 text-[10px] font-medium text-zinc-500">
                      {card.tag}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
