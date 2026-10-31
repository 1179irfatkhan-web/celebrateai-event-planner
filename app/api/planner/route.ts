import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const text = (value: unknown, max = 160) => typeof value === 'string' ? value.trim().slice(0, max) : ''
const id = (value: unknown) => typeof value === 'string' && /^[0-9a-f-]{36}$/i.test(value) ? value : ''
const nonNegativeInt = (value: unknown) => typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : null
const oneOf = <T extends string>(value: unknown, values: readonly T[], fallback: T) => values.includes(value as T) ? value as T : fallback

const eventColumns = 'id,name,event_type,event_date,guest_count,location,total_budget_cents'
const taskColumns = 'id,event_id,title,due_date,completed,priority,status'
const guestColumns = 'id,event_id,name,email,rsvp_status,dietary_notes'
const vendorColumns = 'id,event_id,name,category,status,quoted_cents,estimated_cents,actual_cents,contact_email,contact_phone,notes'
const categoryColumns = 'id,event_id,name,planned_cents,actual_cents'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 })
  const { data: events, error } = await supabase.from('events').select(eventColumns).eq('user_id', user.id).order('event_date', { ascending: true, nullsFirst: false })
  if (error) return NextResponse.json({ error: 'Could not load planner data.' }, { status: 500 })
  const eventId = events?.[0]?.id
  if (!eventId) return NextResponse.json({ events: [], tasks: [], budget: null, guests: [], vendors: [], categories: [] })
  const [{ data: tasks }, { data: budget }, { data: guests }, { data: vendors }, { data: categories }] = await Promise.all([
    supabase.from('event_tasks').select(taskColumns).eq('event_id', eventId).order('completed').order('due_date', { ascending: true, nullsFirst: false }),
    supabase.from('budgets').select('id,event_id,total_cents,spent_cents,currency').eq('event_id', eventId).maybeSingle(),
    supabase.from('guests').select(guestColumns).eq('event_id', eventId).order('name'),
    supabase.from('vendors').select(vendorColumns).eq('event_id', eventId).order('name'),
    supabase.from('budget_categories').select(categoryColumns).eq('event_id', eventId).order('name'),
  ])
  return NextResponse.json({ events: events ?? [], tasks: tasks ?? [], budget: budget ?? null, guests: guests ?? [], vendors: vendors ?? [], categories: categories ?? [] })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 })
  const body = await request.json().catch(() => null) as Record<string, unknown> | null
  const action = text(body?.action, 40)
  if (!body || !action) return NextResponse.json({ error: 'Invalid planner action.' }, { status: 400 })

  if (action === 'create_event') {
    const name = text(body.name, 120)
    if (!name) return NextResponse.json({ error: 'Event name is required.' }, { status: 400 })
    const { data, error } = await supabase.from('events').insert({ user_id: user.id, name, event_type: text(body.event_type, 40) || 'Celebration', event_date: text(body.event_date, 10) || null, guest_count: nonNegativeInt(body.guest_count) ?? 0, location: text(body.location, 160) || null, total_budget_cents: nonNegativeInt(body.total_budget_cents) ?? 0 }).select(eventColumns).single()
    if (error) return NextResponse.json({ error: 'Could not create event.' }, { status: 400 })
    const budgetResult = await supabase.from('budgets').insert({ event_id: data.id, total_cents: nonNegativeInt(body.total_budget_cents) ?? 0 }).select('id,event_id,total_cents,spent_cents,currency').single()
    if (budgetResult.error) return NextResponse.json({ event: data, warning: 'Event created, but its budget record could not be initialized.' })
    return NextResponse.json({ event: data, budget: budgetResult.data })
  }

  const eventId = id(body.event_id)
  if (!eventId) return NextResponse.json({ error: 'A valid event is required.' }, { status: 400 })

  if (action === 'update_event') {
    const values: Record<string, unknown> = {}
    if (typeof body.name === 'string') values.name = text(body.name, 120)
    if (typeof body.event_type === 'string') values.event_type = text(body.event_type, 40)
    if (typeof body.event_date === 'string') values.event_date = text(body.event_date, 10) || null
    if (typeof body.location === 'string') values.location = text(body.location, 160) || null
    if (nonNegativeInt(body.guest_count) !== null) values.guest_count = body.guest_count
    if (nonNegativeInt(body.total_budget_cents) !== null) values.total_budget_cents = body.total_budget_cents
    if (!Object.keys(values).length) return NextResponse.json({ error: 'No event changes provided.' }, { status: 400 })
    const { data, error } = await supabase.from('events').update(values).eq('id', eventId).eq('user_id', user.id).select(eventColumns).single()
    if (error) return NextResponse.json({ error: 'Could not update event.' }, { status: 400 })
    return NextResponse.json({ event: data })
  }

  if (action === 'delete_event') {
    const { error } = await supabase.from('events').delete().eq('id', eventId).eq('user_id', user.id)
    if (error) return NextResponse.json({ error: 'Could not delete event.' }, { status: 400 })
    return NextResponse.json({ deleted: eventId })
  }

  if (action === 'create_task') {
    const title = text(body.title, 160)
    if (!title) return NextResponse.json({ error: 'Task title is required.' }, { status: 400 })
    const priority = oneOf(body.priority, ['low', 'medium', 'high'] as const, 'medium')
    const { data, error } = await supabase.from('event_tasks').insert({ event_id: eventId, title, due_date: text(body.due_date, 10) || null, priority, status: 'open' }).select(taskColumns).single()
    if (error) return NextResponse.json({ error: 'Could not create task.' }, { status: 400 })
    return NextResponse.json({ task: data })
  }

  if (action === 'update_task') {
    const taskId = id(body.task_id)
    const values: Record<string, unknown> = {}
    if (typeof body.completed === 'boolean') { values.completed = body.completed; values.status = body.completed ? 'completed' : 'open' }
    if (typeof body.title === 'string') values.title = text(body.title, 160)
    if (typeof body.due_date === 'string') values.due_date = text(body.due_date, 10) || null
    if (['low', 'medium', 'high'].includes(String(body.priority))) values.priority = body.priority
    if (!taskId || !Object.keys(values).length) return NextResponse.json({ error: 'Invalid task update.' }, { status: 400 })
    const { data, error } = await supabase.from('event_tasks').update(values).eq('id', taskId).eq('event_id', eventId).select(taskColumns).single()
    if (error) return NextResponse.json({ error: 'Could not update task.' }, { status: 400 })
    return NextResponse.json({ task: data })
  }

  if (action === 'delete_task') {
    const taskId = id(body.task_id)
    if (!taskId) return NextResponse.json({ error: 'Invalid task.' }, { status: 400 })
    const { error } = await supabase.from('event_tasks').delete().eq('id', taskId).eq('event_id', eventId)
    if (error) return NextResponse.json({ error: 'Could not delete task.' }, { status: 400 })
    return NextResponse.json({ deleted: taskId })
  }

  if (action === 'update_budget') {
    const total = nonNegativeInt(body.total_cents)
    const spent = nonNegativeInt(body.spent_cents)
    if (total === null || spent === null || spent > total) return NextResponse.json({ error: 'Budget values are invalid.' }, { status: 400 })
    const { data, error } = await supabase.from('budgets').upsert({ event_id: eventId, total_cents: total, spent_cents: spent, currency: text(body.currency, 3).toUpperCase() || 'USD' }, { onConflict: 'event_id' }).select('id,event_id,total_cents,spent_cents,currency').single()
    if (error) return NextResponse.json({ error: 'Could not update budget.' }, { status: 400 })
    await supabase.from('events').update({ total_budget_cents: total }).eq('id', eventId).eq('user_id', user.id)
    return NextResponse.json({ budget: data })
  }

  if (action === 'create_category' || action === 'update_category') {
    const name = text(body.name, 80)
    const planned = nonNegativeInt(body.planned_cents)
    const actual = nonNegativeInt(body.actual_cents)
    if (!name || planned === null || actual === null) return NextResponse.json({ error: 'Budget category details are invalid.' }, { status: 400 })
    const values = { event_id: eventId, name, planned_cents: planned, actual_cents: actual }
    const result = action === 'create_category' ? await supabase.from('budget_categories').insert(values).select(categoryColumns).single() : await supabase.from('budget_categories').update(values).eq('id', id(body.category_id)).eq('event_id', eventId).select(categoryColumns).single()
    if (result.error) return NextResponse.json({ error: 'Could not save budget category.' }, { status: 400 })
    return NextResponse.json({ category: result.data })
  }

  if (action === 'delete_category') {
    const categoryId = id(body.category_id)
    if (!categoryId) return NextResponse.json({ error: 'Invalid budget category.' }, { status: 400 })
    const { error } = await supabase.from('budget_categories').delete().eq('id', categoryId).eq('event_id', eventId)
    if (error) return NextResponse.json({ error: 'Could not delete budget category.' }, { status: 400 })
    return NextResponse.json({ deleted: categoryId })
  }

  if (action === 'create_guest' || action === 'update_guest') {
    const name = text(body.name, 120)
    const status = oneOf(body.rsvp_status, ['pending', 'attending', 'declined'] as const, 'pending')
    if (!name) return NextResponse.json({ error: 'Guest details are invalid.' }, { status: 400 })
    const values = { event_id: eventId, name, email: text(body.email, 254) || null, rsvp_status: status, dietary_notes: text(body.dietary_notes, 300) || null }
    const result = action === 'create_guest' ? await supabase.from('guests').insert(values).select(guestColumns).single() : await supabase.from('guests').update(values).eq('id', id(body.guest_id)).eq('event_id', eventId).select(guestColumns).single()
    if (result.error) return NextResponse.json({ error: 'Could not save guest.' }, { status: 400 })
    return NextResponse.json({ guest: result.data })
  }

  if (action === 'delete_guest') {
    const guestId = id(body.guest_id)
    if (!guestId) return NextResponse.json({ error: 'Invalid guest.' }, { status: 400 })
    const { error } = await supabase.from('guests').delete().eq('id', guestId).eq('event_id', eventId)
    if (error) return NextResponse.json({ error: 'Could not delete guest.' }, { status: 400 })
    return NextResponse.json({ deleted: guestId })
  }

  if (action === 'create_vendor' || action === 'update_vendor') {
    const name = text(body.name, 120)
    if (!name) return NextResponse.json({ error: 'Vendor name is required.' }, { status: 400 })
    const values = { event_id: eventId, name, category: text(body.category, 60) || 'Other', status: oneOf(body.status, ['researching', 'contacted', 'booked'] as const, 'researching'), quoted_cents: nonNegativeInt(body.quoted_cents), estimated_cents: nonNegativeInt(body.estimated_cents), actual_cents: nonNegativeInt(body.actual_cents), contact_email: text(body.contact_email, 254) || null, contact_phone: text(body.contact_phone, 40) || null, notes: text(body.notes, 300) || null }
    const result = action === 'create_vendor' ? await supabase.from('vendors').insert(values).select(vendorColumns).single() : await supabase.from('vendors').update(values).eq('id', id(body.vendor_id)).eq('event_id', eventId).select(vendorColumns).single()
    if (result.error) return NextResponse.json({ error: 'Could not save vendor.' }, { status: 400 })
    return NextResponse.json({ vendor: result.data })
  }

  if (action === 'delete_vendor') {
    const vendorId = id(body.vendor_id)
    if (!vendorId) return NextResponse.json({ error: 'Invalid vendor.' }, { status: 400 })
    const { error } = await supabase.from('vendors').delete().eq('id', vendorId).eq('event_id', eventId)
    if (error) return NextResponse.json({ error: 'Could not delete vendor.' }, { status: 400 })
    return NextResponse.json({ deleted: vendorId })
  }

  if (action === 'save_suggestion') {
    const title = text(body.title, 160)
    const description = text(body.description, 600)
    if (!title || !description) return NextResponse.json({ error: 'Suggestion details are required.' }, { status: 400 })
    const { data, error } = await supabase.from('ai_suggestions').insert({ event_id: eventId, title, description, category: text(body.category, 60) || 'general', source: 'gemini' }).select('id,event_id,title,description,category,source,dismissed').single()
    if (error) return NextResponse.json({ error: 'Could not save suggestion.' }, { status: 400 })
    return NextResponse.json({ suggestion: data })
  }

  return NextResponse.json({ error: 'Unsupported planner action.' }, { status: 400 })
}
