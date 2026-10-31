import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const root = new URL('../', import.meta.url)

async function readProjectFile(path) {
  return readFile(new URL(path, root), 'utf8')
}

test('Next config keeps security headers enabled and disables framework fingerprinting', async () => {
  const config = await readProjectFile('next.config.mjs')
  assert.match(config, /poweredByHeader:\s*false/)
  assert.match(config, /X-Content-Type-Options/)
  assert.match(config, /Content-Security-Policy-Report-Only/)
  assert.match(config, /frame-ancestors 'self'/)
})

test('client code does not contain server-only secret names or unsafe HTML sinks', async () => {
  const page = await readProjectFile('app/page.tsx')
  assert.doesNotMatch(page, /SUPABASE_SERVICE_ROLE_KEY|SUPABASE_SECRET_KEY|POSTGRES_PASSWORD/)
  assert.doesNotMatch(page, /dangerouslySetInnerHTML/)
})

test('the dashboard uses authenticated planner data without browser persistence hacks', async () => {
  const page = await readProjectFile('app/page.tsx')
  const plannerApi = await readProjectFile('app/api/planner/route.ts')
  assert.match(page, /Live workspace/)
  assert.match(page, /useSWR<DashboardData>\('\/api\/planner'/)
  assert.doesNotMatch(page, /localStorage|sessionStorage|insert\(|update\(|delete\(/i)
  assert.match(plannerApi, /export async function GET/)
})
