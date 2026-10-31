import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'

const root = new URL('../', import.meta.url)
const read = (path) => readFile(new URL(path, root), 'utf8')

test('planner API enforces authentication and event ownership', async () => {
  const route = await read('app/api/planner/route.ts')
  assert.match(route, /supabase\.auth\.getUser\(\)/)
  assert.match(route, /Sign in required/)
  assert.match(route, /eq\('user_id', user\.id\)/)
  assert.match(route, /delete_event/)
  assert.match(route, /update_event/)
})

test('planner API exposes real persistence workflows', async () => {
  const route = await read('app/api/planner/route.ts')
  for (const action of ['create_event', 'create_task', 'update_task', 'update_budget', 'create_guest', 'create_vendor', 'save_suggestion']) {
    assert.match(route, new RegExp(`action === '${action}'`), `missing ${action}`)
  }
  assert.match(route, /budget_categories/)
  assert.match(route, /ai_suggestions/)
})
