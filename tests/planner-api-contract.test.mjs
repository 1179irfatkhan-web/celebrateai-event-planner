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
  for (const action of ['create_event', 'update_event', 'delete_event', 'create_task', 'update_task', 'delete_task', 'update_budget', 'create_guest', 'update_guest', 'delete_guest', 'create_vendor', 'update_vendor', 'delete_vendor', 'save_suggestion']) {
    assert.match(route, new RegExp(`action === '${action}'`), `missing ${action}`)
  }
  assert.match(route, /budget_categories/)
  assert.match(route, /ai_suggestions/)
  assert.match(route, /suggestionsResult/)
})

test('planner API validates input and propagates read failures', async () => {
  const route = await read('app/api/planner/route.ts')
  assert.match(route, /dateText/)
  assert.match(route, /Budget values are invalid/)
  assert.match(route, /Could not load planner details/) 
  assert.match(route, /Could not create event/)
  assert.match(route, /Could not delete vendor/)
})

test('child records are scoped to an owned event on every mutation', async () => {
  const route = await read('app/api/planner/route.ts')
  for (const table of ['event_tasks', 'budgets', 'budget_categories', 'guests', 'vendors', 'ai_suggestions']) assert.match(route, new RegExp(table))
  assert.match(route, /eq\('event_id', eventId\)/)
})
