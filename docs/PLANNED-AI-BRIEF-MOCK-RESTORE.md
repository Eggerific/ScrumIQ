# AI brief API — contract & extensions

The **main backlog flow** on **`/projects/[id]/brief`** generates artifacts via **`lib/projects/ai-backlog-stub.ts`** (stub). It does **not** call **`POST /api/projects/ai-brief`** today. **`lib/projects/ai-brief-client.ts`** remains available if you wire optional narrative-brief features later. The legacy **`ProjectAiBriefModal.tsx`** is unused. This doc remains the **`POST /api/projects/ai-brief`** contract for mock/live brief JSON.

---

## Endpoints

- **`POST /api/projects/ai-brief`** — body = `ProjectAiBriefInput` (JSON). Success = `ProjectAiBriefResponse` + `mode: "mock" | "live"`.

## Environment

- **`SCRUMIQ_AI_MODE`** — unset or `mock` → use `buildMockAiBrief`. `live` → implement provider (today returns **501** until wired). The app reads the same variable on the client via **`GET /api/ai-config`** (no `NEXT_PUBLIC_*` duplicate).

## Types (`lib/projects/ai-brief-types.ts`)

```ts
export interface ProjectAiBriefInput {
  title: string;
  vision: string;
  targetUsers: string;
  success90d: string;
  constraints: string;
  freeformNotes: string;
}

export interface ProjectStructuredBrief {
  elevatorPitch: string;
  goals: string[];
  nonGoals: string[];
  risks: string[];
  suggestedThemes: { title: string; description: string }[];
  acceptanceHints: string[];
  freeformSummary?: string;
}

export interface ProjectAiBriefResponse {
  mode: "mock" | "live";
  narrative: string;
  structured: ProjectStructuredBrief;
}
```

## Git

To recover an older version of a file:

```bash
git log --oneline -- app/api/projects/ai-brief/route.ts
git checkout <commit> -- app/api/projects/ai-brief/route.ts
```

---

## Checklist (reconnect AI later)

- [ ] Optional: call `POST /api/projects/ai-brief` from the product if you add a narrative-brief step again.
- [ ] Keep `POST` validation aligned with the form you add (today nothing in the modal calls the API).
- [ ] Document any new env vars in `README.md`.

See **Projects workspace** overview: [PROJECTS-WORKSPACE.md](./PROJECTS-WORKSPACE.md).

For the **follow-on flow** (after the brief: generated epics/stories/AC/tasks, review, then backlog), see [AI-BRIEF-AND-BACKLOG-GENERATION-FLOW.md](./AI-BRIEF-AND-BACKLOG-GENERATION-FLOW.md).
