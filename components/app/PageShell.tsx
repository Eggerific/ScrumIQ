"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const easeSmooth = [0.25, 0.1, 0.25, 1] as const;

const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.08,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.32, ease: easeSmooth },
  },
};

interface PageShellProps {
  title: string;
  /** Omit or leave empty to hide the subtitle line. */
  subtitle?: string;
  children?: React.ReactNode;
  className?: string;
}

/** Shared shell for app pages: staggered title + subtitle (+ optional content) with motion. */
export function PageShell({
  title,
  subtitle,
  children,
  className,
}: PageShellProps) {
  const showSubtitle = Boolean(subtitle?.trim());
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="visible"
      className={cn("p-6 font-sans md:p-8", className)}
    >
      <motion.div variants={item} className="space-y-2">
        <h1
          className="text-2xl font-bold tracking-tight md:text-3xl"
          style={{ color: "var(--foreground)" }}
        >
          {title}
        </h1>
        <div
          className="h-0.5 w-12 rounded-full"
          style={{ background: "var(--app-accent)" }}
          aria-hidden
        />
      </motion.div>
      {showSubtitle ? (
        <motion.p
          variants={item}
          className="mt-2 text-base leading-relaxed text-zinc-300 md:mt-3 md:text-[1.05rem]"
        >
          {subtitle}
        </motion.p>
      ) : null}
      {children ? (
        <motion.div variants={item} className={showSubtitle ? "mt-6" : "mt-4"}>
          {children}
        </motion.div>
      ) : null}
    </motion.div>
  );
}
