# CelebrateAI

CelebrateAI is an AI-assisted event-planning workspace for weddings, birthdays, and community celebrations. The dashboard presents an intentionally labeled demo workspace while the authentication and assistant paths use the configured Supabase and Gemini integrations.

## Implemented

- Supabase email/password authentication with callback handling, email-confirmation messaging, and protected workspace routes.
- Responsive dashboard shell with desktop sidebar and mobile menu.
- Authenticated dashboard metrics, budget visualization, milestone/task checklist, and AI assistant panel.
- Supabase-backed event, task, budget, guest, vendor, category, and AI suggestion workflows through the ownership-checked planner API.
- Live Gemini planning requests through `/api/assistant`, with server-side credentials, bounded execution, validation, request IDs, and categorized failure responses.
- Clearly labeled deterministic Demo Planning Mode for provider outages or presentations; it is not represented as live AI.
- Security headers, protected assistant API access, and regression tests for auth boundaries and assistant contracts.

## Product boundaries

The planner persists user-owned event records and planning data through Supabase with RLS and server-side ownership checks. Vendor records are planning notes only: the app does not invent quotes, availability, or verified bookings. Demo Planning Mode is explicitly labeled and is separate from live Gemini responses.

## Environment

Required server/runtime configuration:

- Supabase URL and publishable/anon key for browser/server session handling.
- `GEMINI_API_KEY` for live assistant requests. Keep it server-side; never expose it as a `NEXT_PUBLIC_` variable.
- `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL` for email-confirmation callbacks in the v0 preview.

The assistant uses `gemini-3-flash-preview`, a 10-second provider deadline, one provider attempt, and a 15-second route ceiling. If Gemini is unavailable, the UI exposes a retry action and a visibly labeled Demo Planning Mode.

## Run locally

```bash
pnpm install
pnpm dev
```

The app runs at `http://localhost:3000`.

## Checks

Run the required local checks from the project root:

```bash
pnpm install --frozen-lockfile
pnpm test
pnpm exec tsc --noEmit
pnpm run lint
pnpm run build
```

The browser release checks require an isolated deployment and disposable Supabase users. Configure the seven `E2E_*` variables described in [`docs/e2e-auth-fixture.md`](docs/e2e-auth-fixture.md), then run:

```bash
pnpm exec playwright install chromium
pnpm test:e2e
pnpm test:a11y
pnpm test:security:e2e
```

The Playwright suites intentionally do not fall back to demo or production accounts. Missing or invalid disposable credentials block the protected planner, accessibility, and two-user RLS checks.

## Release process

Use [`docs/release-checklist.md`](docs/release-checklist.md) for the controlled merge, post-deployment smoke test, and rollback procedure. Do not merge or deploy until the isolated Playwright and two-user RLS checks execute successfully.
