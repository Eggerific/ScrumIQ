"use client";

import { useLayoutEffect, useRef, useState } from "react";
import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { ScrumIQLogoMark } from "@/components/app/AppLogo";
import { usePrefersReducedMotion } from "@/lib/hooks/usePrefersReducedMotion";
import {
  Plus,
  ListTodo,
  GitBranch,
  LayoutGrid,
  Users,
  FolderKanban,
  Target,
} from "lucide-react";

const easeSmooth = [0.25, 0.1, 0.25, 1] as const;

const OUTER_ORBIT_SEC = 96;
const INNER_ORBIT_SEC = 132;
/** ~4.8× faster than base — hover boost is obvious (RAF-driven, not keyframe duration). */
const OUTER_ORBIT_BOOSTED_SEC = 20;
const INNER_ORBIT_BOOSTED_SEC = 28;

/**
 * Distance from orbit center to each outer tile center = (box/2) − ORBIT_INSET.
 * ~18px half-tile + ~14px breathing room so borders/shadows don’t clip.
 */
const ORBIT_INSET = 32;

interface ProjectsEmptyStateProps {
  onCreateClick: () => void;
}

function OrbitGuide({ radius }: { radius: number }) {
  const size = Math.max(0, radius * 2);
  return (
    <div
      className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-[var(--app-accent)]/15"
      style={{ width: size, height: size }}
      aria-hidden
    />
  );
}

/** Stable px string for orbit math — avoids SSR/client float hydration mismatches. */
function orbitPx(n: number): string {
  return (Math.round(n * 100) / 100).toFixed(2);
}

/**
 * Places the tile center on the orbit at `angleDeg` (0° = top, clockwise).
 * Uses calc + translate(-50%,-50%) so the anchor isn’t a 0×0 box (which skews
 * transform-origin in some engines). Counter-rotate only undoes the ring spin.
 */
function OrbitSatellite({
  angleDeg,
  radiusPx,
  parentRotation,
  children,
}: {
  angleDeg: number;
  radiusPx: number;
  /** Cumulative parent ring rotation (deg); counter-rotation keeps satellites upright. */
  parentRotation: MotionValue<number>;
  children: React.ReactNode;
}) {
  const rad = (angleDeg * Math.PI) / 180;
  const x = Math.sin(rad) * radiusPx;
  const y = -Math.cos(rad) * radiusPx;
  const upright = useTransform(parentRotation, (r) => -r);

  return (
    <div
      className="absolute"
      suppressHydrationWarning
      style={{
        left: `calc(50% + ${orbitPx(x)}px)`,
        top: `calc(50% + ${orbitPx(y)}px)`,
        transform: "translate3d(-50%, -50%, 0)",
      }}
    >
      <motion.div
        className="will-change-transform"
        style={{
          rotate: upright,
          transformOrigin: "50% 50%",
          backfaceVisibility: "hidden",
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}

interface OuterIconSpec {
  angle: number;
  icon: React.ReactNode;
}

function OrbitalHero({
  boostOrbit,
  reduceMotion,
}: {
  boostOrbit: boolean;
  reduceMotion: boolean;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [{ outerR, innerR }, setRadii] = useState({ outerR: 118, innerR: 72 });
  const outerRotate = useMotionValue(0);
  const innerRotate = useMotionValue(0);

  useAnimationFrame((_, delta) => {
    const boost = boostOrbit && !reduceMotion;
    const oSec = boost ? OUTER_ORBIT_BOOSTED_SEC : OUTER_ORBIT_SEC;
    const iSec = boost ? INNER_ORBIT_BOOSTED_SEC : INNER_ORBIT_SEC;
    outerRotate.set(
      outerRotate.get() + (360 / (oSec * 1000)) * delta
    );
    innerRotate.set(
      innerRotate.get() - (360 / (iSec * 1000)) * delta
    );
  });

  useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;

    const update = () => {
      const s = Math.min(el.clientWidth, el.clientHeight);
      if (s <= 0) return;
      const half = s / 2;
      const outer = Math.max(48, Math.round(half - ORBIT_INSET));
      const inner = Math.max(32, Math.round(outer * 0.62));
      setRadii({ outerR: outer, innerR: inner });
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const iconCls =
    "block size-3.5 shrink-0 text-[var(--app-accent)]";

  const outerIcons: OuterIconSpec[] = [
    { angle: 0, icon: <FolderKanban className={iconCls} strokeWidth={2} aria-hidden /> },
    { angle: 60, icon: <ListTodo className={iconCls} strokeWidth={2} aria-hidden /> },
    { angle: 120, icon: <GitBranch className={iconCls} strokeWidth={2} aria-hidden /> },
    { angle: 180, icon: <LayoutGrid className={iconCls} strokeWidth={2} aria-hidden /> },
    { angle: 240, icon: <Users className={iconCls} strokeWidth={2} aria-hidden /> },
    { angle: 300, icon: <Target className={iconCls} strokeWidth={2} aria-hidden /> },
  ];

  const satelliteClass =
    "box-border flex size-9 shrink-0 items-center justify-center rounded-xl border border-[var(--app-sidebar-border)] bg-[var(--auth-card)]/95 text-[var(--app-accent)] shadow-[0_0_20px_-6px_oklch(0.65_0.19_165_/_0.4)]";

  return (
    <div
      ref={boxRef}
      className="relative mb-8 aspect-square w-[min(300px,78vw)] shrink-0 md:mb-10 md:w-[min(340px,82vw)]"
      aria-hidden
    >
      <motion.div
        className="pointer-events-none absolute left-1/2 top-1/2 h-52 w-52 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-35 blur-3xl md:h-60 md:w-60"
        style={{
          background:
            "radial-gradient(circle, oklch(0.65 0.19 165 / 0.28) 0%, transparent 68%)",
        }}
        animate={
          reduceMotion
            ? { scale: 1, opacity: 0.32 }
            : { scale: [1, 1.06, 1], opacity: [0.28, 0.38, 0.28] }
        }
        transition={
          reduceMotion
            ? { duration: 0 }
            : { duration: 8, repeat: Infinity, ease: "easeInOut" }
        }
      />

      <OrbitGuide radius={outerR} />
      <OrbitGuide radius={innerR} />

      {/* Outer ring — clockwise (speed reacts immediately on hover via RAF). */}
      <motion.div
        className="absolute inset-0"
        style={{
          rotate: outerRotate,
          transformOrigin: "center center",
        }}
      >
        {outerIcons.map(({ angle, icon }) => (
          <OrbitSatellite
            key={angle}
            angleDeg={angle}
            radiusPx={outerR}
            parentRotation={outerRotate}
          >
            <span className={satelliteClass}>{icon}</span>
          </OrbitSatellite>
        ))}
      </motion.div>

      {/* Inner ring — counter-clockwise */}
      <motion.div
        className="absolute inset-0"
        style={{
          rotate: innerRotate,
          transformOrigin: "center center",
        }}
      >
        {[0, 120, 240].map((angle) => (
          <OrbitSatellite
            key={angle}
            angleDeg={angle}
            radiusPx={innerR}
            parentRotation={innerRotate}
          >
            <span className="flex size-3 items-center justify-center">
              <span className="block size-2 shrink-0 rounded-full bg-[var(--app-accent)] shadow-[0_0_12px_oklch(0.65_0.19_165_/_0.65)] ring-2 ring-[var(--app-accent)]/20" />
            </span>
          </OrbitSatellite>
        ))}
      </motion.div>

      <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
        <motion.div
          className="flex h-[5.25rem] w-[5.25rem] items-center justify-center rounded-2xl border border-[var(--app-sidebar-border)] bg-[var(--auth-card)]/85 shadow-[0_0_48px_-10px_oklch(0.65_0.19_165_/_0.45)] backdrop-blur-md md:h-24 md:w-24"
          animate={reduceMotion ? { y: 0 } : { y: [0, -5, 0] }}
          transition={
            reduceMotion
              ? { duration: 0 }
              : {
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }
          }
        >
          <motion.div
            animate={
              reduceMotion
                ? { filter: "drop-shadow(0 0 0px transparent)" }
                : {
                    filter: [
                      "drop-shadow(0 0 0px transparent)",
                      "drop-shadow(0 0 16px oklch(0.65 0.19 165 / 0.5))",
                      "drop-shadow(0 0 0px transparent)",
                    ],
                  }
            }
            transition={
              reduceMotion
                ? { duration: 0 }
                : {
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }
            }
          >
            <span className="flex h-12 w-8 items-center justify-center [&_svg]:h-full [&_svg]:w-full">
              <ScrumIQLogoMark />
            </span>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

export function ProjectsEmptyState({ onCreateClick }: ProjectsEmptyStateProps) {
  const reduceMotion = usePrefersReducedMotion();
  const [createHovered, setCreateHovered] = useState(false);
  const boostOrbit = !reduceMotion && createHovered;

  return (
    <div className="flex min-h-[min(560px,calc(100vh-12rem))] flex-col items-center justify-center px-4 py-12">
      <div className="relative flex w-full max-w-lg flex-col items-center">
        <OrbitalHero boostOrbit={boostOrbit} reduceMotion={reduceMotion} />

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.12, ease: easeSmooth }}
          className="text-center"
        >
          <h2
            className="text-xl font-semibold tracking-tight md:text-2xl"
            style={{ color: "var(--foreground)" }}
          >
            No projects yet
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-zinc-500 md:text-base">
            Create a project to get started.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.28, ease: easeSmooth }}
          className="mt-10"
        >
          <motion.button
            type="button"
            onClick={onCreateClick}
            onMouseEnter={() => setCreateHovered(true)}
            onMouseLeave={() => setCreateHovered(false)}
            onFocus={() => setCreateHovered(true)}
            onBlur={() => setCreateHovered(false)}
            whileHover={reduceMotion ? undefined : { scale: 1.02 }}
            whileTap={reduceMotion ? undefined : { scale: 0.98 }}
            transition={{ duration: 0.2, ease: easeSmooth }}
            className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl px-7 py-3.5 text-sm font-semibold shadow-[0_0_32px_-6px_oklch(0.65_0.19_165_/_0.55)] md:px-8 md:text-base"
            style={{
              background: "var(--app-accent)",
              color: "var(--background)",
            }}
          >
            <motion.span
              className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              initial={{ x: "-120%" }}
              whileHover={reduceMotion ? undefined : { x: "120%" }}
              transition={{ duration: 0.65, ease: easeSmooth }}
              aria-hidden
            />
            <Plus
              className="relative z-10 h-4 w-4 shrink-0 opacity-90 md:h-[1.125rem] md:w-[1.125rem]"
              strokeWidth={2.5}
              aria-hidden
            />
            <span className="relative z-10">New project</span>
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
