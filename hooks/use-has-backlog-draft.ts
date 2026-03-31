"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { readBacklogDraft } from "@/lib/projects/backlog-draft-storage";

/**
 * True when a session backlog draft exists for the project.
 *
 * Always `false` on the server and on the first client paint so markup matches SSR
 * (sidebar must not switch between `<Link>` and `<span>` before hydration). Reads
 * `sessionStorage` after mount (rAF) so setState isn’t synchronous inside an effect body.
 */
export function useHasBacklogDraft(projectId: string | null): boolean {
  const pathname = usePathname();
  const [has, setHas] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const id = requestAnimationFrame(() => {
      if (cancelled) return;
      if (!projectId) {
        setHas(false);
        return;
      }
      setHas(readBacklogDraft(projectId) !== null);
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(id);
    };
  }, [projectId, pathname]);

  return has;
}
