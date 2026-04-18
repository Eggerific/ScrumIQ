"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  ArrowLeft,
  GitBranch,
  GripVertical,
  Layers,
  Minus,
  Plus,
  Meh,
  RefreshCw,
} from "lucide-react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { fetchProjectSprintStories } from "@/lib/projects/fetch-project-sprint-stories";
import type { SprintStoryRow } from "@/lib/projects/sprint-story-types";
import {
  getSprintStoriesCache,
  setSprintStoriesCache,
} from "@/lib/projects/sprint-stories-session-cache";
import {
  DEFAULT_SPRINT_CAPACITY,
  readSprintCapacityPoints,
  writeSprintCapacityPoints,
} from "@/lib/projects/sprint-capacity-storage";
import { PageShell } from "@/components/app/PageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  EPIC_BADGE,
  STORY_CARD_CLASS,
} from "@/components/projects/ai-flow/backlog-display-styles";
import { patchStory } from "@/lib/projects/patch-story-client";
import { subscribeProjectStoriesChanged } from "@/lib/projects/project-stories-sync-events";

const ZONE_BACKLOG = "zone-backlog";
const ZONE_SPRINT = "zone-sprint";

const FIBONACCI = [1, 2, 3, 5, 8, 13, 21] as const;

/** Prefer pointer-inside drop targets (helps empty zones), then corners. */
const sprintCollision: CollisionDetection = (args) => {
  const inside = pointerWithin(args);
  if (inside.length > 0) return inside;
  return closestCorners(args);
};

function resolveDropColumn(
  overId: string | undefined,
  stories: SprintStoryRow[]
): "backlog" | "sprint" | null {
  if (!overId) return null;
  if (overId === ZONE_BACKLOG) return "backlog";
  if (overId === ZONE_SPRINT) return "sprint";
  const hit = stories.find((s) => s.id === overId);
  if (hit) return hit.in_sprint ? "sprint" : "backlog";
  return null;
}

function SprintDropZone({
  id,
  label,
  children,
  className,
  isEmpty,
  emptyHint,
}: {
  id: string;
  label: string;
  children: ReactNode;
  className?: string;
  isEmpty: boolean;
  emptyHint: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col rounded-2xl border transition-[border-color,box-shadow] duration-200",
        "bg-zinc-950/20 ring-1 ring-zinc-800/40",
        /** Tall placeholder when empty; with cards, height follows content */
        isEmpty && "min-h-[min(70vh,520px)] overflow-hidden",
        isOver
          ? "border-[var(--app-accent)]/55 shadow-[0_0_0_1px_oklch(0.7_0.08_160_/_0.25)]"
          : "border-zinc-600/25",
        className
      )}
      aria-label={label}
    >
      {isEmpty ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-16 text-center">
          <div
            className="rounded-full border border-dashed border-zinc-500/40 bg-zinc-900/40 px-4 py-2 text-xs font-medium uppercase tracking-wide text-zinc-500"
            aria-hidden
          >
            Drop zone
          </div>
          <p className="max-w-[240px] text-sm leading-relaxed text-zinc-500">
            {emptyHint}
          </p>
        </div>
      ) : (
        <div className="p-3 pt-4">{children}</div>
      )}
    </div>
  );
}

function StoryCardBody({
  story,
  epicTitle,
  showUnsetPoints,
  onPointsChange,
  dragHandleProps,
  isDragging,
  overlayMode,
  onAddToSprint,
  onMoveToBacklog,
}: {
  story: SprintStoryRow;
  epicTitle: string;
  showUnsetPoints: boolean;
  onPointsChange: (pts: number | null) => void;
  dragHandleProps?: HTMLAttributes<HTMLButtonElement>;
  isDragging?: boolean;
  /** Drag preview: hide handle and point controls. */
  overlayMode?: boolean;
  onAddToSprint?: () => void;
  onMoveToBacklog?: () => void;
}) {
  return (
    <div
      className={cn(
        STORY_CARD_CLASS,
        "rounded-xl p-3.5 transition-opacity duration-150",
        isDragging && "opacity-40"
      )}
    >
      <div className="flex gap-2">
        {!overlayMode ? (
          <button
            type="button"
            className="mt-0.5 flex h-8 w-6 shrink-0 cursor-grab touch-none items-center justify-center rounded-md border border-transparent text-zinc-500 transition-colors hover:border-zinc-500/30 hover:bg-zinc-800/50 hover:text-zinc-300 active:cursor-grabbing"
            aria-label="Drag to move story"
            {...dragHandleProps}
          >
            <GripVertical className="size-4" aria-hidden />
          </button>
        ) : null}
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className={cn(
                EPIC_BADGE,
                "max-w-full truncate border-[#874e94]/40 text-xs font-normal"
              )}
              title={epicTitle}
            >
              <Layers className="mr-1 size-3 shrink-0 opacity-80" aria-hidden />
              {epicTitle}
            </Badge>
            {showUnsetPoints && story.in_sprint && story.story_points == null ? (
              <span className="text-xs font-medium text-amber-200/90">
                Set points
              </span>
            ) : null}
          </div>
          <p className="text-sm font-medium leading-snug text-zinc-100">
            {story.title.trim() || "Untitled story"}
          </p>
          {!overlayMode ? (
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="mr-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                Points
              </span>
              {FIBONACCI.map((n) => (
                <Button
                  key={n}
                  type="button"
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-7 min-w-8 px-2 text-xs font-semibold",
                    story.story_points === n
                      ? "border-[var(--app-accent)]/60 bg-[color-mix(in_oklch,var(--app-accent),transparent_78%)] text-emerald-50"
                      : "border-zinc-600/40 bg-zinc-900/30 text-zinc-300 hover:bg-zinc-800/50"
                  )}
                  aria-pressed={story.story_points === n}
                  aria-label={`Set story points to ${n}`}
                  onClick={() =>
                    onPointsChange(story.story_points === n ? null : n)
                  }
                >
                  {n}
                </Button>
              ))}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-zinc-500 hover:text-zinc-300"
                aria-label="Clear story points"
                onClick={() => onPointsChange(null)}
              >
                Clear
              </Button>
            </div>
          ) : (
            <p className="text-xs text-zinc-500">
              {story.story_points != null ? (
                <>
                  <span className="font-semibold tabular-nums text-zinc-300">
                    {story.story_points}
                  </span>{" "}
                  pts
                </>
              ) : (
                "Not estimated"
              )}
            </p>
          )}
          {!overlayMode && (onAddToSprint || onMoveToBacklog) ? (
            <div className="mt-3 flex flex-wrap gap-2 border-t border-zinc-600/20 pt-3">
              {onAddToSprint ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 border-[var(--app-accent)]/40 bg-[color-mix(in_oklch,var(--app-accent),transparent_90%)] text-xs font-medium text-emerald-100 hover:bg-[color-mix(in_oklch,var(--app-accent),transparent_82%)]"
                  onClick={onAddToSprint}
                >
                  <GitBranch className="size-3.5 opacity-90" aria-hidden />
                  Add to sprint
                </Button>
              ) : null}
              {onMoveToBacklog ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5 text-xs font-medium text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200"
                  onClick={onMoveToBacklog}
                >
                  <ArrowLeft className="size-3.5" aria-hidden />
                  To product backlog
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function DraggableStoryRow({
  story,
  epicTitle,
  showUnsetPoints,
  onPointsChange,
  onAddToSprint,
  onMoveToBacklog,
}: {
  story: SprintStoryRow;
  epicTitle: string;
  showUnsetPoints: boolean;
  onPointsChange: (pts: number | null) => void;
  onAddToSprint?: () => void;
  onMoveToBacklog?: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: story.id,
    data: { type: "story", story },
  });

  return (
    <div ref={setNodeRef} className="touch-none">
      <StoryCardBody
        story={story}
        epicTitle={epicTitle}
        showUnsetPoints={showUnsetPoints}
        onPointsChange={onPointsChange}
        dragHandleProps={{ ...listeners, ...attributes }}
        isDragging={isDragging}
        onAddToSprint={onAddToSprint}
        onMoveToBacklog={onMoveToBacklog}
      />
    </div>
  );
}

function sprintPageTitle(projectName: string) {
  return `Sprint backlog — ${projectName}`;
}

function ColumnHeading({
  title,
  count,
  subtitle,
}: {
  title: string;
  count: number;
  subtitle: string;
}) {
  const countLabel = `${count} ${count === 1 ? "story" : "stories"}`;
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-semibold tracking-tight text-zinc-100">
          {title}
        </h2>
        <span
          className="inline-flex items-center gap-2 rounded-full border border-[var(--app-accent)]/40 bg-[var(--app-nav-active-bg)] px-3 py-1 shadow-[0_0_0_1px_oklch(0.65_0.19_165_/_0.06)]"
          title={countLabel}
          aria-label={countLabel}
        >
          <span className="text-base font-bold leading-none tabular-nums text-[var(--app-accent)]">
            {count}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            {count === 1 ? "story" : "stories"}
          </span>
        </span>
      </div>
      <div
        className="h-0.5 w-10 rounded-full"
        style={{ background: "var(--app-accent)" }}
        aria-hidden
      />
      <p className="text-sm leading-relaxed text-zinc-500">{subtitle}</p>
    </div>
  );
}

function CapacityShelf({
  committedPoints,
  unestimatedInSprint,
  sprintStoryCount,
  capacity,
  onCapacityChange,
  overCapacity,
}: {
  committedPoints: number;
  unestimatedInSprint: number;
  sprintStoryCount: number;
  capacity: number;
  onCapacityChange: (n: number) => void;
  overCapacity: boolean;
}) {
  const pct =
    capacity > 0 ? Math.min(100, (committedPoints / capacity) * 100) : 0;

  return (
    <div className="space-y-4 rounded-2xl border border-zinc-600/30 bg-gradient-to-br from-zinc-900/80 via-zinc-950/90 to-zinc-950 p-5 shadow-[inset_0_1px_0_0_oklch(1_0_0_/_0.04)]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-zinc-100">
            Capacity
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            Committed story points vs your team&apos;s target for this sprint.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="sprint-capacity-input">
            Team capacity in story points
          </label>
          <span className="text-xs text-zinc-500">Target</span>
          <div
            className={cn(
              "flex h-9 items-stretch overflow-hidden rounded-lg border border-zinc-600/50 bg-zinc-900/80",
              "shadow-[inset_0_1px_0_0_oklch(1_0_0_/_0.04)]"
            )}
          >
            <input
              id="sprint-capacity-input"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              spellCheck={false}
              value={capacity}
              onChange={(e) => {
                const raw = e.target.value.replace(/\D/g, "");
                if (raw === "") {
                  onCapacityChange(1);
                  return;
                }
                const v = Number.parseInt(raw, 10);
                if (Number.isFinite(v)) {
                  onCapacityChange(Math.min(999, Math.max(1, v)));
                }
              }}
              className="w-[4.5rem] shrink-0 border-0 bg-transparent px-2 text-center text-sm font-semibold tabular-nums text-zinc-100 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--app-accent)]/35"
            />
            <div
              className="flex shrink-0 border-l border-zinc-600/40"
              role="group"
              aria-label="Adjust target capacity"
            >
              <button
                type="button"
                className="flex w-9 items-center justify-center text-zinc-400 transition-colors hover:bg-zinc-800/90 hover:text-zinc-100 active:bg-zinc-800"
                aria-label="Decrease target capacity by one"
                onClick={() => onCapacityChange(Math.max(1, capacity - 1))}
              >
                <Minus className="size-4" strokeWidth={2.25} aria-hidden />
              </button>
              <button
                type="button"
                className="flex w-9 items-center justify-center border-l border-zinc-600/40 text-zinc-400 transition-colors hover:bg-zinc-800/90 hover:text-zinc-100 active:bg-zinc-800"
                aria-label="Increase target capacity by one"
                onClick={() => onCapacityChange(Math.min(999, capacity + 1))}
              >
                <Plus className="size-4" strokeWidth={2.25} aria-hidden />
              </button>
            </div>
          </div>
          <span className="text-xs text-zinc-500">pts</span>
        </div>
      </div>

      <div
        className={cn(
          "relative h-3 overflow-hidden rounded-full bg-zinc-800/80 ring-1 ring-zinc-700/50",
          overCapacity && "ring-amber-500/40"
        )}
        role="meter"
        aria-valuemin={0}
        aria-valuemax={capacity}
        aria-valuenow={committedPoints}
        aria-label="Committed story points"
      >
        <motion.div
          className={cn(
            "h-full rounded-full",
            overCapacity
              ? "bg-gradient-to-r from-amber-500/90 to-orange-600/90"
              : "bg-gradient-to-r from-[var(--app-accent)]/85 to-emerald-600/75"
          )}
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 420, damping: 38 }}
        />
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <span className="text-zinc-300">
          <span className="font-semibold tabular-nums text-zinc-100">
            {committedPoints}
          </span>
          <span className="text-zinc-500"> / </span>
          <span className="tabular-nums text-zinc-400">{capacity}</span>
          <span className="ml-1 text-xs text-zinc-500">pts committed</span>
        </span>
        <span className="text-zinc-500">
          {sprintStoryCount} stor{sprintStoryCount === 1 ? "y" : "ies"} in sprint
          {unestimatedInSprint > 0 ? (
            <>
              {" "}
              ·{" "}
              <span className="font-medium text-amber-200/90">
                {unestimatedInSprint} without points
              </span>
            </>
          ) : null}
        </span>
      </div>
    </div>
  );
}

export function SprintBacklogView({
  projectId,
  projectName,
}: {
  projectId: string;
  projectName: string;
}) {
  const pathname = usePathname();
  const prevPathnameRef = useRef<string | null>(null);
  /** `null` = no data yet (show loading). Cached rows from Backlog → Sprint skip the empty state. */
  const [stories, setStories] = useState<SprintStoryRow[] | null>(() =>
    getSprintStoriesCache(projectId)
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [capacity, setCapacity] = useState(DEFAULT_SPRINT_CAPACITY);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 10 } })
  );

  useEffect(() => {
    setCapacity(readSprintCapacityPoints(projectId));
  }, [projectId]);

  useEffect(() => {
    setStories(getSprintStoriesCache(projectId));
    setLoadError(null);
  }, [projectId]);

  const persistCapacity = useCallback(
    (n: number) => {
      const clamped = Math.min(999, Math.max(1, Math.round(n)));
      setCapacity(clamped);
      writeSprintCapacityPoints(projectId, clamped);
    },
    [projectId]
  );

  const reload = useCallback(
    async (opts?: { userAction?: boolean }) => {
      setLoadError(null);
      if (opts?.userAction) setRefreshing(true);
      const supabase = createClient();
      try {
        const rows = await fetchProjectSprintStories(supabase, projectId);
        if (rows === null) {
          setLoadError(
            "Could not load stories. Check your connection and try again."
          );
          setStories([]);
          return;
        }
        setStories(rows);
        setSprintStoriesCache(projectId, rows);
      } finally {
        if (opts?.userAction) setRefreshing(false);
      }
    },
    [projectId]
  );

  useEffect(() => {
    void reload();
  }, [reload]);

  /** Refetch when navigating onto this page (e.g. Backlog → Sprint) without relying on remount. */
  useEffect(() => {
    if (!pathname) return;
    const prev = prevPathnameRef.current;
    prevPathnameRef.current = pathname;
    if (prev === null) return;
    if (!pathname.includes(`/projects/${projectId}/sprint`)) return;
    void reload();
  }, [pathname, projectId, reload]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible") void reload();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [reload]);

  useEffect(() => {
    return subscribeProjectStoriesChanged(projectId, () => {
      void reload();
    });
  }, [projectId, reload]);

  const backlogList = useMemo(
    () => stories?.filter((s) => !s.in_sprint) ?? [],
    [stories]
  );
  const sprintList = useMemo(
    () => stories?.filter((s) => s.in_sprint) ?? [],
    [stories]
  );

  const committedPoints = useMemo(
    () =>
      sprintList.reduce(
        (sum, s) => sum + (typeof s.story_points === "number" ? s.story_points : 0),
        0
      ),
    [sprintList]
  );
  const unestimatedInSprint = useMemo(
    () => sprintList.filter((s) => s.story_points == null).length,
    [sprintList]
  );
  const overCapacity = committedPoints > capacity;

  const activeStory = useMemo(
    () => (activeId ? stories?.find((s) => s.id === activeId) : null),
    [activeId, stories]
  );

  const updateStoryLocal = useCallback(
    (storyId: string, patch: Partial<SprintStoryRow>) => {
      setStories((prev) =>
        prev
          ? prev.map((s) => (s.id === storyId ? { ...s, ...patch } : s))
          : prev
      );
    },
    []
  );

  const handlePointsChange = useCallback(
    async (storyId: string, pts: number | null) => {
      setActionError(null);
      const prev = stories?.find((s) => s.id === storyId);
      updateStoryLocal(storyId, { story_points: pts });
      const result = await patchStory(projectId, storyId, { story_points: pts });
      if (!result.ok) {
        if (prev) updateStoryLocal(storyId, { story_points: prev.story_points });
        setActionError(result.message);
      }
    },
    [projectId, stories, updateStoryLocal]
  );

  const applyInSprint = useCallback(
    async (storyId: string, inSprint: boolean) => {
      const story = stories?.find((s) => s.id === storyId);
      if (!story || story.in_sprint === inSprint) return;
      setActionError(null);
      updateStoryLocal(storyId, { in_sprint: inSprint });
      const result = await patchStory(projectId, storyId, { in_sprint: inSprint });
      if (!result.ok) {
        updateStoryLocal(storyId, { in_sprint: story.in_sprint });
        setActionError(result.message);
      }
    },
    [projectId, stories, updateStoryLocal]
  );

  const handleDragStart = useCallback((e: DragStartEvent) => {
    setActiveId(String(e.active.id));
  }, []);

  const handleDragEnd = useCallback(
    async (e: DragEndEvent) => {
      setActiveId(null);
      const { active, over } = e;
      if (!stories || !over) return;

      const storyId = String(active.id);
      const story = stories.find((s) => s.id === storyId);
      if (!story) return;

      const target = resolveDropColumn(String(over.id), stories);
      if (!target) return;

      const wantSprint = target === "sprint";
      if (story.in_sprint === wantSprint) return;
      await applyInSprint(storyId, wantSprint);
    },
    [applyInSprint, stories]
  );

  if (stories === null) {
    return (
      <PageShell title={sprintPageTitle(projectName)} subtitle="Loading…">
        <p className="text-sm text-zinc-500">Loading stories…</p>
      </PageShell>
    );
  }

  if (loadError) {
    return (
      <PageShell
        title={sprintPageTitle(projectName)}
        subtitle="We couldn’t load your stories."
      >
        <p className="text-sm text-red-300/90">{loadError}</p>
        <Button
          type="button"
          variant="outline"
          className="mt-4"
          onClick={() => void reload({ userAction: true })}
        >
          Retry
        </Button>
      </PageShell>
    );
  }

  const emptyProject = stories.length === 0;

  return (
    <PageShell
      title={sprintPageTitle(projectName)}
      subtitle={
        <>
          Same stories and order as your saved product backlog.{" "}
          <span className="font-medium text-[var(--app-accent)]">
            Drag stories in or use Add to sprint, set points on each card, and
            watch the capacity bar.
          </span>
        </>
      }
    >
      <div className="mx-auto max-w-[1500px] space-y-6 pb-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href={`/projects/${projectId}/backlog`}
              className="inline-flex items-center gap-2 text-base text-zinc-300 transition-colors hover:text-[var(--foreground)]"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Backlog
            </Link>
            <Link
              href={`/projects/${projectId}`}
              className="inline-flex items-center gap-2 text-sm text-zinc-500 transition-colors hover:text-zinc-300"
            >
              Project home
            </Link>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={refreshing}
            className="gap-2 border-zinc-600/50 bg-zinc-900/40 text-zinc-200 hover:bg-zinc-800/60"
            onClick={() => void reload({ userAction: true })}
          >
            <RefreshCw
              className={cn("size-4", refreshing && "animate-spin")}
              aria-hidden
            />
            Refresh
          </Button>
        </div>

        {actionError ? (
          <div
            className="rounded-xl border border-red-500/35 bg-red-950/40 px-4 py-3 text-sm text-red-200/95"
            role="alert"
          >
            {actionError}
          </div>
        ) : null}

        {emptyProject ? (
          <div className="rounded-2xl border border-dashed border-zinc-600/40 bg-zinc-950/40 px-8 py-16 text-center">
            <div
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-400/35 bg-gradient-to-br from-amber-500/14 via-amber-500/6 to-zinc-950/80 shadow-[inset_0_1px_0_0_oklch(1_0_0_/_0.05),0_0_32px_-12px_oklch(0.82_0.14_85_/_0.4)] ring-1 ring-amber-300/15"
              aria-hidden
            >
              <Meh className="size-9 text-amber-200/95" strokeWidth={1.65} />
            </div>
            <p className="mt-4 text-lg font-medium text-zinc-200">
              No stories yet
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500">
              Nothing to pull into a sprint until you have a backlog. Hop over to
              AI Generation and we&apos;ll help you draft one.
            </p>
            <Button
              asChild
              className="mt-6 border-[var(--app-accent)]/50 bg-[color-mix(in_oklch,var(--app-accent),transparent_88%)] text-emerald-50 hover:bg-[color-mix(in_oklch,var(--app-accent),transparent_80%)]"
            >
              <Link href={`/projects/${projectId}/brief`}>Generate</Link>
            </Button>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={sprintCollision}
            onDragStart={handleDragStart}
            onDragEnd={(e) => void handleDragEnd(e)}
          >
            <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
              <motion.section
                className="space-y-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
              >
                <ColumnHeading
                  title="Product backlog"
                  count={backlogList.length}
                  subtitle="Not in this sprint yet. Drag a card, or use Add to sprint."
                />
                <SprintDropZone
                  id={ZONE_BACKLOG}
                  label="Product backlog drop zone"
                  isEmpty={backlogList.length === 0}
                  emptyHint="All stories are in the sprint, or your saved backlog is empty."
                >
                  <motion.ul
                    className="space-y-3 pb-2"
                    initial="hidden"
                    animate="visible"
                    variants={{
                      hidden: {},
                      visible: { transition: { staggerChildren: 0.04 } },
                    }}
                  >
                    {backlogList.map((s) => (
                      <motion.li
                        key={s.id}
                        variants={{
                          hidden: { opacity: 0, y: 6 },
                          visible: { opacity: 1, y: 0 },
                        }}
                        transition={{ duration: 0.22 }}
                      >
                        <DraggableStoryRow
                          story={s}
                          epicTitle={s.epic_title}
                          showUnsetPoints
                          onPointsChange={(pts) =>
                            void handlePointsChange(s.id, pts)
                          }
                          onAddToSprint={() => void applyInSprint(s.id, true)}
                        />
                      </motion.li>
                    ))}
                  </motion.ul>
                </SprintDropZone>
              </motion.section>

              <motion.section
                className="space-y-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.35,
                  delay: 0.06,
                  ease: [0.25, 0.1, 0.25, 1],
                }}
              >
                <CapacityShelf
                  committedPoints={committedPoints}
                  unestimatedInSprint={unestimatedInSprint}
                  sprintStoryCount={sprintList.length}
                  capacity={capacity}
                  onCapacityChange={persistCapacity}
                  overCapacity={overCapacity}
                />
                <ColumnHeading
                  title="Sprint backlog"
                  count={sprintList.length}
                  subtitle="Committed for this sprint. Drag back left or use To product backlog."
                />
                <SprintDropZone
                  id={ZONE_SPRINT}
                  label="Sprint backlog drop zone"
                  isEmpty={sprintList.length === 0}
                  emptyHint="Drag stories here from the left, or add with the button on each card."
                >
                  <motion.ul
                    className="space-y-3 pb-2"
                    initial="hidden"
                    animate="visible"
                    variants={{
                      hidden: {},
                      visible: { transition: { staggerChildren: 0.04 } },
                    }}
                  >
                    {sprintList.map((s) => (
                      <motion.li
                        key={s.id}
                        variants={{
                          hidden: { opacity: 0, y: 6 },
                          visible: { opacity: 1, y: 0 },
                        }}
                        transition={{ duration: 0.22 }}
                      >
                        <DraggableStoryRow
                          story={s}
                          epicTitle={s.epic_title}
                          showUnsetPoints
                          onPointsChange={(pts) =>
                            void handlePointsChange(s.id, pts)
                          }
                          onMoveToBacklog={() => void applyInSprint(s.id, false)}
                        />
                      </motion.li>
                    ))}
                  </motion.ul>
                </SprintDropZone>
              </motion.section>
            </div>

            <DragOverlay dropAnimation={null}>
              {activeStory ? (
                <div className="pointer-events-none w-[min(100vw-2rem,380px)] cursor-grabbing opacity-95 shadow-2xl">
                  <StoryCardBody
                    story={activeStory}
                    epicTitle={activeStory.epic_title}
                    showUnsetPoints={false}
                    onPointsChange={() => {}}
                    overlayMode
                  />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>
    </PageShell>
  );
}
