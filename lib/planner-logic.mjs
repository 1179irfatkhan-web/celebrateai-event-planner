export function remainingBudget(totalCents, spentCents) {
  return Math.max(0, totalCents - spentCents)
}

export function budgetPercent(totalCents, spentCents) {
  if (totalCents <= 0) return 0
  return Math.min(100, Math.round((spentCents / totalCents) * 100))
}

export function openTaskCount(tasks) {
  return tasks.filter((task) => !task.completed).length
}

export function guestResponseCount(guests) {
  return guests.filter((guest) => guest.rsvpStatus !== 'pending').length
}

export function isValidPlannerDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const parsed = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}

export function isValidNonNegativeCents(value) {
  return Number.isInteger(value) && value >= 0
}
