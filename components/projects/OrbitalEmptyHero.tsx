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

const OUTER_ORBIT_SEC = 96;
const INNER_ORBIT_SEC = 132;
const OUTER_ORBIT_BOOSTED_SEC = 20;
const INNER_ORBIT_BOOSTED_SEC = 28;

const ORBIT_INSET = 32;

export interface OrbitalOuterIconSpec {
  angle: number;
  icon: React.ReactNode;
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

function orbitPx(n: number): string {
  return (Math.round(n * 100) / 100).toFixed(2);
}

function OrbitSatellite({
  angleDeg,
  radiusPx,
  parentRotation,
  children,
}: {
  angleDeg: number;
  radiusPx: number;
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

export function OrbitalEmptyHero({
  boostOrbit,
  reduceMotion,
  outerIcons,
  center,
}: {
  boostOrbit: boolean;
  reduceMotion: boolean;
  outerIcons: OrbitalOuterIconSpec[];
  /** Defaults to animated ScrumIQ logo mark */
  center?: React.ReactNode;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [{ outerR, innerR }, setRadii] = useState({ outerR: 118, innerR: 72 });
  const outerRotate = useMotionValue(0);
  const innerRotate = useMotionValue(0);

  useAnimationFrame((_, delta) => {
    const boost = boostOrbit && !reduceMotion;
    const oSec = boost ? OUTER_ORBIT_BOOSTED_SEC : OUTER_ORBIT_SEC;
    const iSec = boost ? INNER_ORBIT_BOOSTED_SEC : INNER_ORBIT_SEC;
    outerRotate.set(outerRotate.get() + (360 / (oSec * 1000)) * delta);
    innerRotate.set(innerRotate.get() - (360 / (iSec * 1000)) * delta);
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

  const satelliteClass =
    "box-border flex size-9 shrink-0 items-center justify-center rounded-xl border border-[var(--app-sidebar-border)] bg-[var(--auth-card)]/95 text-[var(--app-accent)] shadow-[0_0_20px_-6px_oklch(0.65_0.19_165_/_0.4)]";

  const defaultCenter = (
    <span className="flex h-12 w-8 items-center justify-center [&_svg]:h-full [&_svg]:w-full">
      <ScrumIQLogoMark />
    </span>
  );

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
            {center ?? defaultCenter}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
