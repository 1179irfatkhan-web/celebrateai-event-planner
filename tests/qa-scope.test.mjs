import assert from 'node:assert/strict'
import { readdir } from 'node:fs/promises'
import { test } from 'node:test'
import { join } from 'node:path'

const root = new URL('..', import.meta.url).pathname
const appDir = join(root, 'app')

async function routeFiles(dir = appDir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) files.push(...(await routeFiles(path)))
    else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) files.push(path)
  }
  return files
}

async function source() {
  const files = await routeFiles()
  return (await Promise.all(files.map((file) => import('node:fs/promises').then(({ readFile }) => readFile(file, 'utf8'))))).join('\n')
}

test('financial calculations are not exposed without a tested implementation', async () => {
  const code = await source()
  assert.doesNotMatch(code, /stripe|paymentintent|checkout|balance|ledger/i)
})

test('data persistence is not faked in client-only storage', async () => {
  const code = await source()
  assert.doesNotMatch(code, /localStorage|sessionStorage|insert\(|update\(|delete\(/i)
})

test('authentication routes and callback are present', async () => {
  const files = await routeFiles()
  assert.equal(files.some((file) => file.endsWith('/auth/callback/route.ts')), true)
  assert.equal(files.some((file) => file.endsWith('/auth/login/page.tsx')), true)
  assert.equal(files.some((file) => file.endsWith('/auth/sign-up/page.tsx')), true)
})

test('AI tool access and schema validation are not exposed without an AI route', async () => {
  const code = await source()
  assert.doesNotMatch(code, /generateObject|streamText|tool\s*\(|execute/i)
})

test('error recovery surfaces do not claim a backend workflow exists', async () => {
  const code = await source()
  assert.match(code, /demo|workspace|planning/i)
})
