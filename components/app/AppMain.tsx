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
      className="animate-gradient-shift relative z-0 flex min-h-0 flex-1 flex-col overflow-y-auto bg-[var(--app-main-bg)] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      style={{
        backgroundImage: "var(--gradient-auth)",
        backgroundSize: "200% 200%",
        backgroundColor: "var(--app-main-bg)",
        backgroundAttachment: "local",
      }}
    >
      {/* Background paints on the scroll container so no gap/black strip at the bottom */}
      <div className="relative z-10 flex min-h-0 min-w-0 flex-1 flex-col">
        {children}
      </div>
    </motion.main>
  );
}
