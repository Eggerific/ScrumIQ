"use client";

import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

const easeSmooth = [0.25, 0.1, 0.25, 1] as const;

const contentVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: easeSmooth,
      staggerChildren: 0.04,
      delayChildren: 0.05,
    },
  },
};

export function AppMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <motion.main
      key={pathname}
      initial="hidden"
      animate="visible"
      variants={contentVariants}
      className="relative min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto"
      style={{ background: "var(--app-main-bg)" }}
    >
      <div
        className="absolute inset-0 animate-gradient-shift"
        style={{
          backgroundImage: "var(--gradient-auth)",
          backgroundSize: "200% 200%",
        }}
        aria-hidden
      />
      <div className="relative z-10">{children}</div>
    </motion.main>
  );
}
