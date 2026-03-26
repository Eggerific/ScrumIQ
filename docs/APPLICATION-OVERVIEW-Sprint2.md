# Application Overview - Sprint 2

Simple summary of what the team delivered in Sprint 2, who owned each area, and current status for review.

---

## Sprint Snapshot

- **Course:** CSC 550 - Software Engineering
- **Project:** ScrumIQ
- **Sprint window:** Mar 17 - Mar 30, 2026
- **Team:** Delsin Egge, Jack McGowan, Ryan Shapiro, Connor Maxwell
- **Total stories:** 9
- **Total planned points:** 31

Sprint 2 focused on moving from Sprint 1 foundation work (auth + setup) to a usable product flow:
landing page -> login/register -> dashboard -> projects -> project context + AI brief groundwork.

---

## Sprint Goals

1. Build core app navigation and route structure for authenticated users.
2. Implement projects workspace flows (view, create, open project).
3. Establish dashboard and landing page UX.
4. Add AI brief mock contract/parsing safety and backend route scaffolding.
5. Stabilize Supabase schema/table setup and role-based project membership behavior.

---

## What Was Delivered

## 1) Navigation and App Shell
- Added a persistent left sidebar for app routes.
- Added app-level and project-level navigation context switching.
- Added return behavior from project context back to `/projects`.
- Enforced auth-first access behavior for protected routes.

## 2) Dashboard Route and UX
- Added `/dashboard` as the authenticated landing route after login.
- Added summary cards and recent activity feed with mock data for Sprint 2.
- Ensured content layout stays to the right of the sidebar without overlap.

## 3) Projects Workspace
- Added `/projects` list view for member projects.
- Added empty state behavior when user has no projects.
- Added create-project flow with validation.
- Enforced 4-project limit behavior in UI.
- Added project opening flow into project route.

## 4) Project Entry and AI Brief Groundwork
- Added project entry flow to project-specific route (backlog context).
- Added first-visit AI context modal behavior.
- Added typed AI brief request/response contract for mock/live modes.
- Added API route for AI brief generation scaffolding with mock mode support.
- Added safe parsing/error-handling expectations for malformed AI responses.

## 5) Landing Page Improvements
- Updated public landing page to explain ScrumIQ value proposition.
- Added clear Sign up / Log in CTAs from hero/header.
- Added section navigation behavior (for example, Features section jump).

## 6) Data and Schema Stabilization
- Finalized required Supabase tables for Sprint 2 feature set.
- Confirmed project and membership relationships needed by workspace flows.
- Verified app behavior for schema mismatch failures is safe (no app crash).

---

## Team Contributions (Sprint 2)

## Delsin Egge
- Owned most frontend implementation for navigation and projects experience.
- Implemented sidebar behavior, app routing flow, and projects UX.
- Delivered stories: nav context switching, post-login dashboard route behavior, project listing, project creation, project card entry, landing page navigation/CTA flow.

## Jack McGowan
- Owned dashboard UI design and implementation.
- Delivered dashboard cards/activity feed and route-level polish for Sprint 2 readiness.

## Ryan Shapiro
- Owned Supabase schema/table setup and backend data structure support.
- Delivered database-side setup and relationships used by projects and membership flows.

## Connor Maxwell
- Owned AI mock response parsing research and implementation groundwork.
- Delivered robust parsing/fallback direction and API-integration support for AI mock mode.

---

## User Stories and Story Points

Sprint 2 tracked **9 user stories / 31 total points**:

1. Left nav context switching in/out of project - **3 pts** (Delsin)
2. Redirect to `/dashboard` after login with working nav - **2 pts** (Delsin)
3. View all member projects on `/projects` - **3 pts** (Delsin)
4. Create project with role assignment + limits - **3 pts** (Delsin)
5. Open project card into project route/backlog context - **2 pts** (Delsin)
6. Dashboard summary stats + recent activity feed - **5 pts** (Jack)
7. Landing page CTA/navigation for visitors - **3 pts** (Delsin)
8. AI mock JSON parsing reliability and safe failures - **5 pts** (Connor)
9. Manual Supabase schema consistency/reliability - **5 pts** (Ryan)

---

## Testing and Acceptance Status

Testing was documented per user story with success/failure scenarios, including:
- Route protection checks for unauthenticated access.
- Sidebar context behavior checks.
- Projects rendering, empty state, and visibility restrictions.
- Create-project validation and DB insertion behavior.
- Dashboard rendering and layout stability checks.
- Landing page navigation and CTA route checks.
- AI mock parse success/failure safety checks.
- Supabase schema correctness and mismatch handling checks.

Current status from the collected Sprint 2 test log:
- Most stories show expected outcomes and matching actual output.
- A few "actual output" fields were still pending at report drafting time and should be finalized before submission.

---

## Scrum Cadence

Team held at least three Scrum meetings during the sprint:
- **Meeting 1:** 3/19
- **Meeting 2:** 3/23
- **Meeting 3:** 3/26

Standup prompts used:
- What did you do yesterday?
- What will you do today?
- What is blocking your work?

Primary blocker theme noted mid-sprint:
- Frontend integration sequencing depended on final DB table readiness.

---

## Story Point Tracking and Sprint Status

- **Mar 23 checkpoint:** 8 points remaining out of 31 (about 74% complete)  
  Status reported: **On time** (ahead of ideal burndown pace).

- **Mar 30 checkpoint:** 0 points remaining  
  Status reported: **Early** (all stories completed before sprint deadline).

---

## Architecture and Module Design (Sprint 2 Update)

Sprint 2 architecture remained aligned with Sprint 1 layered design:
- **Client:** React/Next.js UI components
- **Application layer:** App Router pages, route handlers, server-side integrations
- **Data/Auth:** Supabase PostgreSQL + Supabase Auth + RLS

Sprint 2 module emphasis:
- Auth and access control
- Navigation and app shell
- Projects workspace
- Project entry/backlog context
- AI brief mock integration

See also:
- `docs/PROJECTS-WORKSPACE.md`
- `docs/PLANNED-AI-BRIEF-MOCK-RESTORE.md`

---

## Sprint Review Readiness (Mar 31)

Planned demo coverage:
1. Demonstrate implemented user stories with test evidence.
2. Walk through key code areas for frontend, backend, and integration.
3. Execute instructor-assigned security-oriented checks.
4. Report Sprint 2 final status and remaining follow-up items (if any).

---

## Notes for Final Report Assembly

- This overview is intentionally short and readable for the Sprint 2 report packet.
- Pair this file with:
  - refined use case diagram,
  - full user story table with acceptance criteria/assignees/points,
  - module design and architecture visuals,
  - detailed test case matrix and actual results,
  - scrum meeting dates,
  - Mar 23 and Mar 30 point/status checkpoints.
