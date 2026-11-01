# CelebrateAI controlled release checklist

## Pre-merge checks

- Confirm the candidate branch contains the intended production base commit and review the full diff.
- Install with `pnpm install --frozen-lockfile`.
- Run `pnpm test`, `pnpm exec tsc --noEmit`, `pnpm run lint`, and `pnpm run build`.
- Configure `E2E_BASE_URL` against a non-production deployment backed by the intended isolated Supabase project.
- Configure the three confirmed disposable account pairs documented in `docs/e2e-auth-fixture.md`.
- Run `pnpm test:e2e`, `pnpm test:a11y`, and `pnpm test:security:e2e`. A skipped or authentication-failing test is a release blocker, not a pass.
- Review Supabase RLS policies for every planner table. Verify user A cannot read or mutate user B’s event, tasks, budget, guests, vendors, categories, or AI suggestions.
- Merge only after review and required CI checks are green.

## Post-deployment smoke test

Run against the exact production deployment and record the deployment ID and Git SHA:

1. Open `/auth/login`; confirm valid email/password login and invalid credentials show generic failure text.
2. Confirm an unauthenticated request to `/api/planner` returns `401`.
3. Load the authenticated dashboard and confirm event data, navigation, and loading/error states render.
4. Create an event, reload, and confirm it persists.
5. In Budget, create, edit, and delete a budget category; reload after each mutation.
6. In Guests, add a guest, change RSVP status, reload, and confirm the status persists; then remove the fixture guest.
7. In Timeline and Vendors, create/update/delete disposable task and vendor fixtures; confirm reload persistence and cleanup.
8. Open the assistant, submit a real planning prompt, and confirm either a successful Gemini response or the clearly labeled retry/Demo Planning Mode path. Never label deterministic demo content as live AI.
9. Confirm no secrets appear in HTML, browser console, client bundles, or error responses.
10. Confirm security headers are present on the deployed response.

## Rollback

The known-good production deployment is `dpl_AjZqZhuAwsUMXCMbjCwxRQBErje9` for `main@4524461a330d82e4c5b2157f96a1b61697ad1d16`. If a smoke test fails, promote that deployment as the rollback target without changing database data or policies. After rollback, repeat steps 1–3 and record the final alias, deployment ID, and Git SHA.
