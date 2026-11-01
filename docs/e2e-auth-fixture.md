# Isolated Playwright authentication fixture

The Playwright suites use the application’s real Supabase browser flow: `app/auth/login/page.tsx` calls `createClient().auth.signInWithPassword`, where the client is configured from `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Playwright starts at `/auth/login`; it does not use the demo button or service-role credentials.

## Create three disposable users

1. Use the Supabase project that matches the isolated deployment’s `NEXT_PUBLIC_SUPABASE_URL`.
2. In Supabase Dashboard, open **Authentication → Users → Add user → Create new user**.
3. Create three unique disposable email accounts:
   - one primary fixture for `E2E_EMAIL` / `E2E_PASSWORD`;
   - one isolation user A for `E2E_USER_A_EMAIL` / `E2E_USER_A_PASSWORD`;
   - one isolation user B for `E2E_USER_B_EMAIL` / `E2E_USER_B_PASSWORD`.
4. Enable **Auto Confirm User** when creating each account, or use the user row’s **Confirm email** action. The suites require `email_confirmed_at` to be set; they do not click confirmation links.
5. Sign in to each account once through `/auth/login` in the isolated deployment to verify the password and session cookie. Do not use a production or demo account.

## Configure the seven variables securely

Set these in the Vercel project’s **Settings → Environment Variables** for the Preview environment used by the isolated deployment. Keep the two passwords secret and never put them in source control, test output, screenshots, or chat:

```text
E2E_BASE_URL=https://<isolated-preview-host>
E2E_EMAIL=<primary-disposable-email>
E2E_PASSWORD=<primary-disposable-password>
E2E_USER_A_EMAIL=<user-a-disposable-email>
E2E_USER_A_PASSWORD=<user-a-disposable-password>
E2E_USER_B_EMAIL=<user-b-disposable-email>
E2E_USER_B_PASSWORD=<user-b-disposable-password>
```

The deployment must be built with the same isolated Supabase project. Verify that the deployed JavaScript references the same Supabase hostname as `NEXT_PUBLIC_SUPABASE_URL`; do not mix a preview URL with production Supabase credentials.

## Verify before running Playwright

From the project root, load the project environment without printing it, then run:

```bash
set -a && source /vercel/share/.env.project && set +a
pnpm exec playwright test --list
pnpm test:e2e
```

A valid setup has three existing users, each with confirmed email, and successful password sign-in. The test output must show five executed tests rather than skipped tests. If Supabase returns `Invalid email or password`, verify the email spelling, password, project URL, and that the account exists in the same Supabase project. If it returns `email_not_confirmed`, confirm the user in Supabase before rerunning.

The two-user test creates a uniquely named event as user A and asserts that user B cannot see it. It must run only against a disposable isolated project because it creates and removes test data.
