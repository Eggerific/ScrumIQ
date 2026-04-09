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

## Safeguards (live generation)

| Layer | Behavior |
|-------|-----------|
| **Brief size** | `validateBriefForBacklogGeneration` — per-field and total character caps before the model runs (`lib/projects/project-brief-generation-limits.ts`). |
| **Prompt** | System guardrails + lower temperature in `lib/projects/live-backlog-from-brief.ts` (stay on-brief, no filler, JSON-only). |
| **Output** | `enforceLiveBacklogDraftSafeguards` — clip string lengths and epic/story/task counts; reject placeholder-like text; require minimum AC/tasks per story (`lib/projects/ai-backlog-draft-safeguards.ts`). Failed checks trigger a retry loop server-side, then **502** with a clear message. |
| **Cost** | Default model is **Claude 3.5 Haiku**; **`max_tokens`** is capped (**6144** by default, overridable via **`ANTHROPIC_MAX_OUTPUT_TOKENS`**). The prompt targets **4–6 epics** and lean text to reduce input+output tokens (`lib/projects/ai-generation-cost-defaults.ts`, `live-backlog-from-brief.ts`). |
| **Client** | Generation lock (no double-submit), **beforeunload** warning while generating, **sessionStorage** pending marker + banner if the user reloads without a draft, client **timeout** aligned with server `maxDuration`. |

---

## QA checklist (manual)

1. **Mock** — `SCRUMIQ_AI_MODE` unset or `mock`: brief → Generate → review → Add to backlog → backlog page.
2. **Live, no key** — `SCRUMIQ_AI_MODE=live`, no `ANTHROPIC_API_KEY`: same flow; draft is deterministic server preview, `artifactSource: "live"`.
3. **Live + key** — Add key: brief produces Claude output; verify epics/stories/AC/tasks are on-topic and pass review UI.
4. **Validation** — Submit over-long brief (paste more than 6k characters in one field or 20k total) → inline / **400** error before or on generate.
5. **Refresh** — Start live generate, refresh during loading → return to brief → amber “interrupted” banner; Generate again succeeds.
6. **Timeout / error** — Induce failure (invalid key or airplane mode) → error phase → Retry → recovers when fixed.
7. **Double submit** — Rapid double-click Generate / Retry → only one request (lock).
8. **Navigation** — `beforeunload` appears when closing tab during generating (browser-dependent confirmation UI).

---

## UI-only development

Routes, validation, loading, review, error/retry, and session backlog work **without** a model API. Stub data uses **`artifactSource: "stub"`** until a live response sets **`"live"`**.
