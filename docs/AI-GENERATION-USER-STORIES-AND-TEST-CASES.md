# AI Generation — user stories & test cases

Short BDD-style stories for the **`/projects/[id]/brief`** flow (mock/live via **`GET /api/ai-config`**, **`POST /api/projects/[projectId]/generate-backlog`** in live mode, artifact review, **`POST .../backlog`** on confirm).

---

## User story 1

**As a** project member using ScrumIQ locally or in a shared environment,  
**I want** the server’s **`SCRUMIQ_AI_MODE`** and **`GET /api/ai-config`** to drive whether backlog generation runs in the browser stub or calls the live generate API,  
**so that** we avoid surprise model usage, keep a single env var (no `NEXT_PUBLIC_*` duplicate), and see a clear Mock vs Live signal on the page.

### Scenarios

**Scenario: Config loads before Generate**

- **Given** the user opens `/projects/[id]/brief` while signed in and is a member of the project  
- **When** the page finishes loading AI settings from **`GET /api/ai-config`**  
- **Then** the **Generate** control is enabled for mock/live (unless config is in error), and a **Mock AI** or **Live AI** status banner matches the resolved mode  

**Scenario: Mock mode — banner and stub generation**

- **Given** the server reports **`mode: mock`** from **`/api/ai-config`** (e.g. `SCRUMIQ_AI_MODE` unset or `mock`)  
- **When** the user submits a valid brief and confirms **Generate**  
- **Then** a **Mock AI** notice is visible, generation completes without calling **`/generate-backlog`**, and artifact review shows non-empty epics from the client stub (`artifactSource: "stub"`)  

**Scenario: Live mode — server generation**

- **Given** the server reports **`mode: live`** and **`SCRUMIQ_AI_MODE=live`** on the server, and the user is authenticated and a project member  
- **When** the user runs **Generate** with valid inputs  
- **Then** a **Live AI** notice is shown, the client calls **`POST /api/projects/[projectId]/generate-backlog`**, and artifact review shows a draft with **`artifactSource: "live"`** (deterministic preview if no API key, or model output if **`ANTHROPIC_API_KEY`** is set)  

### Test cases — User story 1

**Test case 1.1 — Success: Mock generation to review**

| | |
|---|---|
| **Type** | Success |
| **Precondition** | `SCRUMIQ_AI_MODE` unset or `mock`; user logged in; project exists; user is a member; engagement allows brief. |
| **Steps** | 1. Open `/projects/[id]/brief`. 2. Wait for page load. 3. Fill all required brief fields with valid data. 4. Submit → confirm **Generate**. |
| **Expected** | **Mock AI** banner; loading state; artifact review with epics/stories/tasks; draft stored in session; no **`generate-backlog`** network call (or only other API traffic as applicable). |

**Test case 1.2 — Fail: AI config endpoint error**

| | |
|---|---|
| **Type** | Fail |
| **Precondition** | Simulate or cause **`GET /api/ai-config`** to fail (e.g. break route temporarily in dev, or block request in proxy). |
| **Steps** | 1. Open `/projects/[id]/brief`. 2. Observe banner and **Generate** control. |
| **Expected** | Error alert instructing refresh; **Generate** disabled or non-actionable per UI; user cannot complete stub/live generation until config loads. |

---

## User story 2

**As a** project member generating a backlog,  
**I want** validation, safeguards, and recovery when something goes wrong (or I refresh mid-run),  
**so that** I get an on-brief artifact when possible, or a clear error with **Retry** instead of silent bad data.

### Scenarios

**Scenario: Brief too long rejected before live call**

- **Given** **`SCRUMIQ_AI_MODE=live`** and the user is on the brief form  
- **When** the user enters a brief that exceeds client/server limits (e.g. one field **> 6,000** characters or total **> 20,000**) and submits  
- **Then** an inline validation error appears and **Generate** is not confirmed / live API is not called with that payload  

**Scenario: Live generation failure — error and Retry**

- **Given** live mode and a condition that causes generation to fail (e.g. invalid API key, server **`502`**, or timeout)  
- **When** the user runs **Generate** with an otherwise valid brief  
- **Then** the flow lands on the error state with a readable message and **Retry** / **Edit inputs**; no partial draft is shown as success  

**Scenario: Refresh during generation — interrupted hint**

- **Given** the user started **Generate** in live mode and the request is still in flight  
- **When** the user refreshes the page before the client receives a draft  
- **Then** on return to the brief route, an **interrupted generation** notice appears (session pending marker), and they can **Dismiss** or run **Generate** again  

### Test cases — User story 2

**Test case 2.1 — Success: Retry after recoverable error**

| | |
|---|---|
| **Type** | Success |
| **Precondition** | Live mode; temporarily use wrong **`ANTHROPIC_API_KEY`**, then fix key and restart server (or restore network). |
| **Steps** | 1. Open brief, valid brief, **Generate**. 2. Observe error state. 3. Fix key/env, restart dev server. 4. Click **Retry** (or **Edit inputs** then **Generate**). |
| **Expected** | Second attempt completes to artifact review with a valid draft; session draft written. |

**Test case 2.2 — Fail: Oversized brief blocked**

| | |
|---|---|
| **Type** | Fail |
| **Precondition** | User on brief form (mock or live). |
| **Steps** | 1. Paste **> 6,000** characters into a single required field (or exceed total limit across fields). 2. Submit form. |
| **Expected** | Validation message about length; user is not taken to confirm modal with that invalid payload; in live mode, **`POST /generate-backlog`** is not sent for the oversize body. |

---

## Traceability (quick map)

| Area | Primary code / routes |
|------|------------------------|
| Mode + banner | `hooks/use-ai-config.ts`, `app/api/ai-config/route.ts`, `components/projects/ai-flow/ProjectAiFlowView.tsx` |
| Mock generate | `lib/projects/ai-backlog-stub.ts` |
| Live generate | `app/api/projects/[projectId]/generate-backlog/route.ts`, `lib/projects/live-backlog-from-brief.ts` |
| Limits / safeguards | `lib/projects/project-brief-generation-limits.ts`, `lib/projects/ai-backlog-draft-safeguards.ts`, `lib/projects/ai-backlog-brief-alignment.ts` |
| Refresh / pending | `lib/projects/generation-pending-storage.ts` |
| Persist backlog | `app/api/projects/[projectId]/backlog/route.ts` |

---

## Note on older specs

If any legacy doc still says **“live mode blocks generation,”** that predates **`POST /api/projects/[projectId]/generate-backlog`**. Current behavior is described in **`AI-BRIEF-AND-BACKLOG-GENERATION-FLOW.md`**.
