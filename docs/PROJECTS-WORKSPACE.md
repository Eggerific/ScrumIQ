# Projects workspace — simple overview

**Note:** AI backlog **UI/UX and navigation** live in the app; **AI mock mode and JSON parsing** for real responses are owned separately (see [QA-HANDOFF-AI-GENERATION-AND-BACKLOG.md](./QA-HANDOFF-AI-GENERATION-AND-BACKLOG.md) — division of work).

## What we set up

- **Projects list** is the main UX: 2×2 grid, sidebar, quick **create** (title + description), remove, limits.
- **First visit to a project** (`aiBriefEngagement: "pending"`): user is sent to **`/projects/[id]/brief`** to enter **context**, hit **Generate** once, review **epics/stories/tasks** (stub), then **Add to backlog** (session storage). **Skip for now** sets **`dismissed`**; **Add to backlog** sets **`complete`**.
- **Legacy `skipped` / `dismissed` / `complete`**: reopen from the project home link or sidebar **AI backlog** (same route `/brief`).

**Backlog generation** is **`buildStubBacklogDraftFromInput`** (`lib/projects/ai-backlog-stub.ts`) until Connor adds a **`POST`** that returns `AiBacklogDraftPayload`. **`POST /api/projects/ai-brief`** is **not** used on this path (optional for other features).

Seed projects omit `aiBriefEngagement` → no auto-redirect to `/brief`; sidebar still works.

---

## Planned brief fields (UI copy + types)

These are what the explainer modal lists and what `lib/projects/ai-brief-types.ts` defines under `structured`:

| Area | Role |
|------|------|
| **Narrative overview** | Assistant summary tying inputs together (`narrative` on the response). |
| **Elevator pitch** | Short line for the card / stakeholders (`structured.elevatorPitch`). |
| **Goals & non-goals** | `goals[]`, `nonGoals[]`. |
| **Suggested themes** | `suggestedThemes[]` with `title` + `description`. |
| **Risks** | `risks[]`. |
| **Acceptance hints** | `acceptanceHints[]`. |
| **Free-form context (optional)** | `freeformSummary` when PM adds extra notes. |

When AI is reconnected, the **review UI** can be rebuilt or restored to edit these before saving to the project / DB.

---

## For your teammate (AI / backend)

They can own **`app/api/projects/ai-brief/route.ts`**, **`lib/projects/ai-brief-mock.ts`**, **`lib/projects/ai-brief-types.ts`**, plus a future **backlog-generation** API and persistence—without changing the brief **JSON contract** the UI already sends and displays.

**Coordinate** if request/response shapes change; see [PLANNED-AI-BRIEF-MOCK-RESTORE.md](./PLANNED-AI-BRIEF-MOCK-RESTORE.md).

**Extended flow (brief → AI-generated epics/stories/tasks → review → backlog):** see [AI-BRIEF-AND-BACKLOG-GENERATION-FLOW.md](./AI-BRIEF-AND-BACKLOG-GENERATION-FLOW.md). That doc covers end-to-end navigation and **UI-only / stub-first** implementation before backend persistence.

---

## Key files

| File | Role |
|------|------|
| `app/(app)/projects/[id]/brief/page.tsx` | AI brief → backlog draft flow (form, review, stub backlog). |
| `components/projects/ai-flow/ProjectAiFlowView.tsx` | Form → generate → review; backlog from `buildStubBacklogDraftFromInput` (no brief API in this flow). |
| `ProjectBacklogView.tsx` | Reads session draft from `backlog-draft-storage.ts`. |
| `ProjectAiBriefModal.tsx` | Legacy explainer modal (unused; flow lives on `/brief`). |
| `ProjectWorkspaceView.tsx` | `pending` → `router.replace` to `/brief`; link back to flow when dismissed/complete. |
| `CreateProjectModal.tsx` | Sets `aiBriefEngagement: "pending"` on new projects. |
| `app/api/projects/ai-brief/route.ts` | Mock/live brief API (used by flow). |
| `lib/projects/ai-brief-types.ts` | Brief request/response contract. |
