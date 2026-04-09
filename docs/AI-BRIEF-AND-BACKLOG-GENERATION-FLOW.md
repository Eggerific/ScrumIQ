# AI backlog generation — product flow & UI-first implementation

This document describes the **current end-to-end flow**: structured **project context** input, a **single generation** step for **epics / user stories / AC / tasks**, review, then **Backlog** (session draft + Supabase rows when **Add to backlog** succeeds).

**Division of work:** The **UI/UX and navigation** for this flow (routes, forms, review, backlog, engagement) is implemented in the app; a **teammate** owns **AI mock mode**, **JSON parsing**, and wiring real responses into the same payload types (`AiBacklogDraftPayload`, etc.). See [QA-HANDOFF-AI-GENERATION-AND-BACKLOG.md](./QA-HANDOFF-AI-GENERATION-AND-BACKLOG.md) for QA handoff and boundaries.

**Related:** [PROJECTS-WORKSPACE.md](./PROJECTS-WORKSPACE.md), [PLANNED-AI-BRIEF-MOCK-RESTORE.md](./PLANNED-AI-BRIEF-MOCK-RESTORE.md) (optional `POST /api/projects/ai-brief` contract for other use cases — **not** on the main backlog path today).

---

## End-to-end user flow (as implemented)

1. **Structured input** — User fills fields aligned with `ProjectAiBriefInput` (`lib/projects/ai-brief-types.ts`), validates, and submits.
2. **Generating** — One full-area loading state while **backlog artifacts** are produced. The UI loads **`GET /api/ai-config`** so **`SCRUMIQ_AI_MODE`** (in `.env.local` only) drives mock vs live without a duplicate public env var. In **mock** mode (default), **`buildStubBacklogDraftFromInput`** in `lib/projects/ai-backlog-stub.ts` runs in the browser (no API key; no `POST /api/projects/ai-brief` on this path). In **live** mode, the client calls **`POST /api/projects/[projectId]/generate-backlog`** with **`ProjectAiBriefInput`**; the server returns **`AiBacklogDraftPayload`** (deterministic preview with **`artifactSource: "live"`** if **`ANTHROPIC_API_KEY`** is unset, otherwise Claude).
3. **Artifact review** — User inspects epics → stories → acceptance criteria → tasks (`AiBacklogDraftPayload` in `ai-backlog-draft-types.ts`).
4. **Add to backlog** — **`POST /api/projects/[projectId]/backlog`** replaces project epics/stories/tasks in Supabase (members only), then saves the draft to **session storage** and navigates to **`/projects/[id]/backlog`**. Engagement is marked **`complete`**.
5. **Backlog page** — Reads the **session draft** and lists items (DB-backed read UI can follow).

```mermaid
flowchart LR
  A[Context form] --> B[Generating artifacts]
  B --> C[Artifact review]
  C --> D[Add to backlog]
  D --> E[Backlog view]
```

---

## Confirm CTA

| Step | CTA |
|------|-----|
| Form | **Generate** |
| Review | **Add to backlog** — persists session draft and navigates |

---

## Navigation & routes

- **`/projects/[id]/brief`** — Full flow (form → generating → review).
- **`/projects/[id]/backlog`** — Displays session draft or empty state with link back to the flow.

---

## Backend boundaries (Connor)

| Piece | Role |
|-------|------|
| **`POST /api/projects/ai-brief`** | Optional / parallel; **not required** for the backlog flow UI today. |
| **`POST /api/projects/[projectId]/backlog`** | Body `{ draft: AiBacklogDraftPayload }`. Persists hierarchy to **`epics`**, **`stories`**, **`tasks`** (replaces existing rows for that project). Requires **`project_members`** row for the user. |
| **`POST /api/projects/[projectId]/generate-backlog`** | Accepts **`ProjectAiBriefInput`**, returns **`{ draft: AiBacklogDraftPayload }`**. Requires auth, project membership, and **`SCRUMIQ_AI_MODE=live`**. |

The UI uses **`postProjectGenerateBacklog`** in `lib/projects/generate-backlog-client.ts` in live mode; mock mode keeps **`buildStubBacklogDraftFromInput` + `delayGenerationMs`**.

---

## UI-only development

Routes, validation, loading, review, error/retry, and session backlog work **without** a model API. Stub data uses **`artifactSource: "stub"`** until a live response sets **`"live"`**.
