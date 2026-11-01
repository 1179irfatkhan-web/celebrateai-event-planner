import assert from 'node:assert/strict'
import { test } from 'node:test'
import { budgetPercent, guestResponseCount, isValidNonNegativeCents, isValidPlannerDate, openTaskCount, remainingBudget } from '../lib/planner-logic.mjs'

test('budget calculations clamp remaining money and percentage', () => {
  assert.equal(remainingBudget(10000, 3500), 6500)
  assert.equal(remainingBudget(10000, 12000), 0)
  assert.equal(budgetPercent(10000, 3500), 35)
  assert.equal(budgetPercent(0, 100), 0)
})

test('task and RSVP counts reflect persisted statuses', () => {
  assert.equal(openTaskCount([{ completed: false, dueDate: null }, { completed: true, dueDate: '2026-12-01' }]), 1)
  assert.equal(guestResponseCount([{ rsvpStatus: 'pending' }, { rsvpStatus: 'attending' }, { rsvpStatus: 'declined' }]), 2)
})

test('planner date validation rejects impossible dates', () => {
  assert.equal(isValidPlannerDate('2026-12-14'), true)
  assert.equal(isValidPlannerDate('2026-02-29'), false)
  assert.equal(isValidPlannerDate('14/12/2026'), false)
})

test('currency validation accepts only non-negative integer cents', () => {
  assert.equal(isValidNonNegativeCents(0), true)
  assert.equal(isValidNonNegativeCents(250000), true)
  assert.equal(isValidNonNegativeCents(-1), false)
  assert.equal(isValidNonNegativeCents(1.5), false)
})
