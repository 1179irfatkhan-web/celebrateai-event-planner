import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const text = (value: unknown, max = 160) => typeof value === 'string' ? value.trim().slice(0, max) : ''
const id = (value: unknown) => typeof value === 'string' && /^[0-9a-f-]{36}$/i.test(value) ? value : ''
const positiveInt = (value: unknown) => typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : null

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
    const { data, error } = await supabase.from('events').insert({
      user_id: user.id,
      name,
      event_type: text(body.event_type, 40) || 'Celebration',
      event_date: text(body.event_date, 10) || null,
      guest_count: positiveInt(body.guest_count) ?? 0,
      location: text(body.location, 160) || null,
    }).select('id,name,event_type,event_date,guest_count,location').single()
    if (error) return NextResponse.json({ error: 'Could not create event.' }, { status: 400 })
    await supabase.from('budgets').insert({ event_id: data.id })
    return NextResponse.json({ event: data })
  }

  const eventId = id(body.event_id)
  if (!eventId) return NextResponse.json({ error: 'A valid event is required.' }, { status: 400 })

  if (action === 'create_task') {
    const title = text(body.title, 160)
    if (!title) return NextResponse.json({ error: 'Task title is required.' }, { status: 400 })
    const { data, error } = await supabase.from('event_tasks').insert({ event_id: eventId, title, due_date: text(body.due_date, 10) || null }).select('id,event_id,title,due_date,completed').single()
    if (error) return NextResponse.json({ error: 'Could not create task.' }, { status: 400 })
    return NextResponse.json({ task: data })
  }

  if (action === 'update_task') {
    const taskId = id(body.task_id)
    if (!taskId || typeof body.completed !== 'boolean') return NextResponse.json({ error: 'Invalid task update.' }, { status: 400 })
    const { data, error } = await supabase.from('event_tasks').update({ completed: body.completed }).eq('id', taskId).eq('event_id', eventId).select('id,event_id,title,due_date,completed').single()
    if (error) return NextResponse.json({ error: 'Could not update task.' }, { status: 400 })
    return NextResponse.json({ task: data })
  }

  if (action === 'update_budget') {
    const total = positiveInt(body.total_cents)
    const spent = positiveInt(body.spent_cents)
    if (total === null || spent === null || spent > total) return NextResponse.json({ error: 'Budget values are invalid.' }, { status: 400 })
    const { data, error } = await supabase.from('budgets').upsert({ event_id: eventId, total_cents: total, spent_cents: spent, currency: text(body.currency, 3).toUpperCase() || 'USD' }, { onConflict: 'event_id' }).select('id,event_id,total_cents,spent_cents,currency').single()
    if (error) return NextResponse.json({ error: 'Could not update budget.' }, { status: 400 })
    return NextResponse.json({ budget: data })
  }

  if (action === 'create_guest') {
    const name = text(body.name, 120)
    const status = text(body.rsvp_status, 20) || 'pending'
    if (!name || !['pending', 'attending', 'declined'].includes(status)) return NextResponse.json({ error: 'Guest details are invalid.' }, { status: 400 })
    const { data, error } = await supabase.from('guests').insert({ event_id: eventId, name, email: text(body.email, 254) || null, rsvp_status: status, dietary_notes: text(body.dietary_notes, 300) || null }).select('id,event_id,name,email,rsvp_status,dietary_notes').single()
    if (error) return NextResponse.json({ error: 'Could not add guest.' }, { status: 400 })
    return NextResponse.json({ guest: data })
  }

  if (action === 'create_vendor') {
    const name = text(body.name, 120)
    const category = text(body.category, 60) || 'Other'
    if (!name) return NextResponse.json({ error: 'Vendor name is required.' }, { status: 400 })
    const { data, error } = await supabase.from('vendors').insert({ event_id: eventId, name, category, quoted_cents: positiveInt(body.quoted_cents), notes: text(body.notes, 300) || null }).select('id,event_id,name,category,status,quoted_cents,notes').single()
    if (error) return NextResponse.json({ error: 'Could not add vendor.' }, { status: 400 })
    return NextResponse.json({ vendor: data })
  }

  return NextResponse.json({ error: 'Unsupported planner action.' }, { status: 400 })
}
