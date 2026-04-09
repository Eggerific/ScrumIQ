"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect, useState } from "react";
import { readBacklogDraft } from "@/lib/projects/backlog-draft-storage";

/**
 * True when a session backlog draft exists for the project.
 *
 * Server: always `false` (no `sessionStorage`). Client: read per `projectId` in
 * `useLayoutEffect` so we update before paint — avoids carrying the previous
 * project’s draft flag when navigating to another project (which would wrongly
 * lock AI Generation in the sidebar).
 */
export function useHasBacklogDraft(projectId: string | null): boolean {
  const pathname = usePathname();
  const [has, setHas] = useState(false);

  useLayoutEffect(() => {
    if (!projectId) {
      setHas(false);
      return;
    }
    setHas(readBacklogDraft(projectId) !== null);
  }, [projectId, pathname]);

  return has;
}
