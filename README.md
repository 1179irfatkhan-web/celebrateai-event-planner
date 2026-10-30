# CelebrateAI

CelebrateAI is a polished demo dashboard for an AI-assisted event-planning experience. The current implementation is intentionally labeled **Demo workspace** and uses deterministic in-memory sample content.

## Current implementation

- Responsive dashboard shell with desktop sidebar and mobile menu.
- Demo wedding metrics, budget visualization, milestone/task checklist, and AI insight panel.
- Filterable task list with keyboard-accessible completion toggles.
- Accessible AI suggestion dialog with focus management, Escape handling, and a review-before-save label.
- Security headers and regression tests for the current demo surface.

## Important limitation

This repository does **not** yet implement authentication, Supabase tables/RLS, persisted events, budget CRUD, vendor CRUD, guest/RSVP CRUD, server-side AI generation, or protected routes. The sample values are not verified vendors, quotations, availability, or live AI output. Do not use this demo as a production event-planning system until those workflows are implemented.

## Run locally

```bash
pnpm install
pnpm dev
```

The app runs at `http://localhost:3000`.

## Checks

```bash
pnpm exec tsc --noEmit
pnpm test:security
pnpm test:qa
pnpm build
```

There is currently no ESLint configuration or lint script in the repository, so linting is a documented blocker rather than a claimed passing check.

## Environment

The current demo does not read provider credentials. If Supabase and an AI provider are added, keep credentials server-side, add schema migrations and RLS policies, and update this document with the exact setup and test workflow.
