# Projects workspace — simple overview

## What we set up

- **Projects list** is the main UX: 2×2 grid, sidebar, quick **create** (title + description), remove, limits.
- **First visit to a project** (`aiBriefEngagement: "pending"`): a **read-only dialog** opens once. It explains **which fields** a future AI brief is expected to produce (aligned with `ProjectAiBriefResponse` / `ProjectStructuredBrief`). It does **not** call the API or run mock generation in this branch.
- **Continue to project** (or close): marks engagement **`complete`** so the dialog doesn’t auto-open again.
- **Legacy `skipped`**: users who had skipped the old wizard can open **Planned brief fields** anytime; that only shows the same explainer and does **not** change engagement.

**Mock API** (`POST /api/projects/ai-brief`, `lib/projects/ai-brief-mock.ts`) remains for your teammate to iterate on parsing and models; **the modal does not use it yet.**

Seed projects omit `aiBriefEngagement` → treated like “done” (no auto dialog).

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

They can own **`app/api/projects/ai-brief/route.ts`**, **`lib/projects/ai-brief-mock.ts`**, **`lib/projects/ai-brief-types.ts`**, and later wire **`ProjectAiBriefModal`** (or a successor) to `fetch` + a review step—without changing grid/sidebar/create if the **JSON contract** stays compatible.

**Coordinate** if request/response shapes change; see [PLANNED-AI-BRIEF-MOCK-RESTORE.md](./PLANNED-AI-BRIEF-MOCK-RESTORE.md).

---

## Key files

| File | Role |
|------|------|
| `ProjectAiBriefModal.tsx` | Explainer only (planned fields + pointer to types / route). |
| `ProjectWorkspaceView.tsx` | When to open modal; `pending` → `complete` on dismiss. |
| `CreateProjectModal.tsx` | Sets `aiBriefEngagement: "pending"` on new projects. |
| `app/api/projects/ai-brief/route.ts` | Mock/live API (not used by modal today). |
| `lib/projects/ai-brief-types.ts` | Contract the explainer and future UI should match. |
