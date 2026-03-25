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
| `SCRUMIQ_AI_MODE` | Optional. `mock` (default if unset) = `/api/projects/ai-brief` returns local mock data. `live` = reserved until a real provider is implemented. |

These can be found in:
- **Supabase** — [supabase.com](https://supabase.com) → your project → Settings → API
- **Anthropic** — [console.anthropic.com](https://console.anthropic.com) → API Keys

See `docs/PROJECTS-WORKSPACE.md` for the **brief explainer** on first project open (planned fields; API not used by the UI yet).

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

