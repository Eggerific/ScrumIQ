# Application Overview — Sprint 1

A short summary of what the app is, how auth works, and what was delivered in Sprint 1.

---

## Why “Sprint 1”?

This document describes work completed in **Sprint 1**. The goal of the first sprint was to establish the foundation: get the stack running, connect to Supabase, and ship a working auth flow so users can register and log in. No product features (projects, AI planning, etc.) were in scope—only the base that later sprints will build on. Everything in this overview is therefore “Sprint 1”: auth, basic UI, validation, error handling, and docs.

---

## What is ScrumIQ?

ScrumIQ is an **AI-powered Scrum planning tool** built with **Next.js**, **Supabase**, and the **Anthropic Claude API**. The app will help teams plan and run sprints with AI assistance. So far, the foundation is in place: auth, basic UI, and wiring to Supabase.

---

## Tech Stack

| Layer        | Technology                          |
| ------------ | ----------------------------------- |
| Frontend     | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS |
| Auth & DB    | Supabase (PostgreSQL + Supabase Auth) |
| AI           | Anthropic Claude API (not yet used in UI) |
| Styling      | Tailwind, CSS variables, Framer Motion |

---

## Architecture and Module Design

### Architecture (high level)

- **Browser** — React components run in the user’s browser. They use the **browser Supabase client** so login and session work on the client.
- **Server** — Next.js runs on the server. **API routes** (e.g. register) and **Server Components** use the **server Supabase client** so they can read/write cookies and talk to Supabase safely.
- **Proxy** — A single **proxy** runs on every request. It only refreshes the Supabase session and updates cookies. It does not handle routes or business logic.

So: client UI uses the browser client; server and API use the server client; the proxy keeps the session in sync.

### Module design (where things live)

- **lib/** — Shared logic used in more than one place. Supabase clients live here, plus email validation and friendly auth error messages. No UI.
- **components/** — Reusable UI. Auth components (shell, login form, register form) live under **components/auth/**.
- **app/** — Routes and API. **app/(auth)/** holds login and register pages; **app/api/auth/register/** is the register API. Each route or API is thin and delegates to lib or components.
- **proxy.ts** — Session refresh only. No app routes or components.

### Design choices (in short)

- **One place per concern** — One Supabase client module, one validation helper, one place for auth error copy. Easier to change and keep consistent.
- **Right client for the context** — Browser client only in the browser; server/route-handler clients only on the server. Keeps cookies and secrets correct.
- **Shared validation** — Email format is checked in both the form and the register API using the same helper, so the API can’t be bypassed with bad data.
- **Friendly errors** — Supabase errors (rate limit, email not confirmed) are mapped to clear messages in one place and reused on both login and register.

---

## Auth Flow

### Registration

1. User goes to **/register** and submits **name**, **email**, and **password** (with confirm).
2. The form sends a **POST** request to **/api/auth/register** with `email`, `password`, and `full_name`.
3. The API uses Supabase **Auth** only: `supabase.auth.signUp({ email, password, options: { data: { full_name } } })`. We never insert into `auth.users` ourselves.
4. Supabase may require **email confirmation**. If it does:
   - The API returns `{ ok: true, requiresConfirmation: true }`.
   - The UI shows “Check your email” and a “Go to Login” button instead of redirecting to projects.
5. A **database trigger** (`on_auth_user_created`) creates a row in **public.users** with `id`, `email`, `full_name`, and `created_at`. The `id` matches `auth.users`. We never insert into `public.users` manually.

### Login

1. User goes to **/login** and submits **email** and **password**.
2. The **LoginForm** (client) uses the **browser Supabase client** and calls `signInWithPassword({ email, password })`.
3. On success, the user is redirected to **/projects**. On failure, the UI shows a clear message:
   - **Email not confirmed:** “Please confirm your email using the link we sent you, then try signing in again.”
   - **Rate limit:** “Too many attempts. Please wait a few minutes and try again.”
   - **Other:** “Invalid email or password.”

### Where Auth Lives

- **Supabase** owns `auth.users`. We only use the Auth API (signUp, signInWithPassword, etc.).
- **public.users** is our app’s user table: `id` (UUID, same as auth), `email`, `full_name`, `created_at`. No password. RLS is on: users can read/update only their own row (`auth.uid() = id`).
- **Client components** use `createBrowserClient` from **lib/supabase/client.ts**.
- **Server components and API routes** use **lib/supabase/server.ts**: `createClient()` for Server Components/Actions, `createRouteHandlerClient(request, response)` for route handlers so cookies can be set correctly.
- **proxy.ts** (Next.js 16 “proxy”, formerly middleware) runs on each request and refreshes the Supabase session so cookies stay in sync.

### Validation & Errors

- **Email format** is validated on both client and server (shared helper in **lib/validation.ts**). Invalid formats are rejected before calling Supabase.
- If **Supabase URL or anon key** are missing or invalid, the app doesn’t crash: the register API returns **503** with a clear “Supabase is not configured” message.
- **Auth error messages** (rate limit, email not confirmed) are turned into user-friendly text via **lib/auth-messages.ts**.

---

## UI and Routes

| Route         | Purpose |
| ------------- | ------- |
| **/**         | Default Next.js home (placeholder). |
| **/login**    | Login form (email + password). Uses auth layout with Lottie and tab switcher. |
| **/register** | Registration form (name, email, password, confirm). Same auth layout. |
| **/projects** | Post-login placeholder. “Your projects will appear here.” Same gradient background as auth. |

### Auth UI

- **Auth layout** (**app/(auth)/layout.tsx**) wraps **/login** and **/register** with **AuthCardShell**.
- **AuthCardShell** provides:
  - Full-page card with gradient background and CSS variables (e.g. `--auth-accent`, `--auth-border`).
  - Left: “Welcome to ScrumIQ” and a Lottie animation (with static fallback if Lottie fails).
  - Right: tab switcher (Login / Sign Up) and the form (either **LoginForm** or **RegisterForm**).
- Forms use **Framer Motion** for loading and success states, and show clear errors (validation, API errors, rate limit, email not confirmed).

---

## Important Files and Folders

| Path | Purpose |
| ---- | ------- |
| **lib/supabase/client.ts** | Browser Supabase client for client components. |
| **lib/supabase/server.ts** | Server Supabase client and route-handler client; validates Supabase URL. |
| **lib/validation.ts** | Shared email format validation. |
| **lib/auth-messages.ts** | Maps Supabase auth errors to user-friendly messages. |
| **app/api/auth/register/route.ts** | POST register: validates body, calls Supabase signUp, returns `requiresConfirmation` when needed. |
| **proxy.ts** | Session refresh for Supabase (Next.js 16 proxy). |
| **components/auth/** | AuthCardShell, LoginForm, RegisterForm. |
| **.env.example** | Template for `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `ANTHROPIC_API_KEY`. |

---

## Environment and Config

- **.env.local** (git-ignored) must define:
  - `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL.
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon/public key.
  - `ANTHROPIC_API_KEY` — For Claude (server-side; not yet used in flows).
- Copy from **.env.example** and fill in values. Without valid Supabase URL/key, auth routes return a clear 503 instead of crashing.

---

## Supabase Setup (Reminder)

- **public.users**: columns `id` (UUID, references auth.users), `email`, `full_name`, `created_at`. No password.
- **Trigger** on `auth.users` insert: create one row in `public.users` from `new.raw_user_meta_data ->> 'full_name'` and auth id/email.
- **RLS** on `public.users`: policy `auth.uid() = id` so users see and edit only their row.
- **Email**: Built-in Supabase email has a low sending limit (e.g. 2/hour). For more sign-ups or production, configure a custom SMTP provider in the Supabase dashboard. NOTE: We can turn the limit off but automatically confirrm authintecation

---

## What’s Next (Not Yet Built)

- Home page and navigation (beyond placeholder).
- Projects list and CRUD (backend and UI).
- Integration with Anthropic Claude for Scrum planning.
- Any other product features.

This doc reflects the state of the app as of the last update. For setup and running the app, see the main **README.md** in the project root.
