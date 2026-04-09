# ScrumIQ
An AI-Powered Scrum Planning Tool built with Next.js, Supabase, and the Anthropic Claude API.

---

## Tech Stack
- **Frontend/Backend** — Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Database & Auth** — Supabase (PostgreSQL + Supabase Auth)
- **AI** — Anthropic Claude API
- **Containerization** — Docker

---

## Getting Started

Every team member needs to complete these steps before developing.

### 1. Clone the repo and switch to develop

```bash
git clone https://github.com/Eggerific/ScrumIQ.git
cd ScrumIQ
git checkout -b develop origin/develop
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env.local` file in the root of the project:

```bash
cp .env.example .env.local
```

Then open `.env.local` and fill in the values — see the team's shared credentials for the Supabase and Anthropic keys.

> **Never commit `.env.local` to GitHub.** It is already listed in `.gitignore`.

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to verify everything is working.

---

## Environment Variables

The following variables are required in your `.env.local`:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous public key |
| `ANTHROPIC_API_KEY` | Your Anthropic Claude API key (server-side only) |
| `SCRUMIQ_AI_MODE` | Optional. Single switch in `.env.local` (no `NEXT_PUBLIC_*` copy needed). `mock` (default if unset) = mock brief responses and the backlog flow uses **`buildStubBacklogDraftFromInput`** in the browser (no API credits). `live` = brief flow unchanged; backlog generation calls **`POST /api/projects/[projectId]/generate-backlog`** (server). Without **`ANTHROPIC_API_KEY`**, that route still returns a deterministic **`artifactSource: "live"`** preview for local E2E. The client reads the mode via **`GET /api/ai-config`**. |
| `ANTHROPIC_MODEL` | Optional. Backlog generation defaults to **Claude Haiku 4.5** (`claude-haiku-4-5-20251001`) for lower cost. Set to e.g. **`claude-sonnet-4-20250514`** when you want stronger reasoning (higher spend). |
| `ANTHROPIC_MAX_OUTPUT_TOKENS` | Optional. Caps **output** tokens per generation request (integer **2048–8192**, default **6144**). Lower = cheaper ceiling; too low may truncate JSON and force retries. Server only. |


These can be found in:
- **Supabase** — [supabase.com](https://supabase.com) → your project → Settings → API
- **Anthropic** — [console.anthropic.com](https://console.anthropic.com) → API Keys

See `docs/PROJECTS-WORKSPACE.md` for the **brief explainer** on first project open (planned fields; API not used by the UI yet).

### Supabase: AI Generation completion (required for production)

The app stores **`projects.ai_brief_engagement`** in Postgres so “Add to backlog” stays final after restarts and new browsers. Apply the migration in your Supabase project:

- **SQL:** `supabase/migrations/20260408120000_add_projects_ai_brief_engagement.sql`  
  Run the file contents in **SQL Editor** (or your usual migration workflow).

Without this column, **creating projects** and **finalizing AI backlog** may fail until the migration is applied.

### Supabase: removing a project (`epics_project_id_fkey`)

**Cause:** With RLS, client-side **`DELETE`** plus **`SELECT` count checks** can both look “empty” while rows still exist (e.g. **`SELECT`** policies hide backlog rows), so the app deletes **`projects`** too early and Postgres raises **`epics_project_id_fkey`**.

**Fix (required):** Run **`supabase/migrations/20260409140000_rpc_delete_project_for_owner.sql`**. It adds **`public.delete_project_for_owner(uuid)`**, a **`SECURITY DEFINER`** RPC that deletes **`tasks` → `stories` → `epics` → `project_members` → `projects`** in one transaction after verifying **`auth.uid()`** is the project **owner**. The app calls this RPC only; it does **not** rely on per-table **`DELETE`** policies for removal.

**Optional:** **`20260409130000_rls_backlog_delete_via_is_project_owner.sql`** improves owner **`DELETE`** policies if you still delete backlog rows from the client elsewhere. It does **not** replace the RPC for “remove project.”

### Keeping AI costs down (students & side projects)

- Use **`SCRUMIQ_AI_MODE=mock`** (or leave unset) while building UI—no Anthropic charges.
- With **`SCRUMIQ_AI_MODE=live`** and **no** `ANTHROPIC_API_KEY`, the app uses a **free deterministic** server preview (still `artifactSource: "live"`).
- When you add a key, **Haiku stays the default**; the prompt asks for a **smaller backlog tree** (4–6 epics) and **capped output tokens** to limit worst-case cost.
- For a big class project or demo where quality matters more than price, set **`ANTHROPIC_MODEL`** to a Sonnet id and optionally raise **`ANTHROPIC_MAX_OUTPUT_TOKENS`** (still capped at 8192 in code).
- In the [Anthropic console](https://console.anthropic.com), set **usage limits / alerts** so you get notified before a surprise bill.

---

## Branching Strategy

```
main          ← stable, production-ready only
  └── develop      ← all sprint work merges here
        └── feature/your-feature-name   ← your working branch
```

- Always branch off `develop`, never `main`
- Name branches `feature/`, `fix/`, or `chore/` followed by a short description
- Open all PRs against `develop`

---

## Branching Workflow

```bash
# Make sure develop is up to date
git checkout develop
git pull origin develop

# Create your feature branch
git checkout -b feature/your-feature-name

# When done, push and open a PR against develop
git push -u origin feature/your-feature-name
```

---

## Project Structure (Sprint 1)

```
ScrumIQ/
├── app/
│   ├── (auth)/                    # Route group — URLs stay /login, /register
│   │   ├── layout.tsx             # Wraps login/register with AuthCardShell
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── register/
│   │       └── page.tsx
│   ├── projects/
│   │   ├── loading.tsx            # Loading state (matches auth style)
│   │   └── page.tsx
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   └── auth/
│       ├── AuthCardShell.tsx      # Shared card + Lottie + tab switcher
│       ├── LoginForm.tsx
│       └── RegisterForm.tsx
├── lib/
│   └── utils.ts
└── .env.example
```

When you add Supabase: add `lib/supabase/client.ts` (and optionally `server.ts`), plus `middleware.ts` for protected routes.

