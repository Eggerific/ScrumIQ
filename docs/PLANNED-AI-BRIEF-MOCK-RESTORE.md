# AI brief API — contract & extensions

The **product UI** currently shows a **read-only explainer** in `ProjectAiBriefModal.tsx` (planned fields, no `fetch`). This doc is the **HTTP + type contract** for whoever implements parsing, mock output, or a live model and later reconnects generation + review UI.

---

## Endpoints

- **`POST /api/projects/ai-brief`** — body = `ProjectAiBriefInput` (JSON). Success = `ProjectAiBriefResponse` + `mode: "mock" | "live"`.

## Environment

- **`SCRUMIQ_AI_MODE`** — unset or `mock` → use `buildMockAiBrief`. `live` → implement provider (today returns **501** until wired).

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

- [ ] Add client `fetch` + loading/review UX (or restore a prior review step) that maps to `ProjectAiBriefResponse`.
- [ ] Keep `POST` validation aligned with the form you add (today nothing in the modal calls the API).
- [ ] Document any new env vars in `README.md`.

See **Projects workspace** overview: [PROJECTS-WORKSPACE.md](./PROJECTS-WORKSPACE.md).
