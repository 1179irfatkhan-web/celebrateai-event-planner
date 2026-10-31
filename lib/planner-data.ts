import { createClient } from '@/lib/supabase/server'

export type PlannerEvent = {
  id: string
  name: string
  event_type: string
  event_date: string | null
  guest_count: number
  location: string | null
}

export type PlannerTask = {
  id: string
  event_id: string
  title: string
  due_date: string | null
  completed: boolean
}

export type PlannerBudget = {
  id: string
  event_id: string
  total_cents: number
  spent_cents: number
  currency: string
}

export type PlannerGuest = {
  id: string
  event_id: string
  name: string
  email: string | null
  rsvp_status: 'pending' | 'attending' | 'declined'
  dietary_notes: string | null
}

export type PlannerVendor = {
  id: string
  event_id: string
  name: string
  category: string
  status: 'researching' | 'contacted' | 'booked'
  quoted_cents: number | null
  notes: string | null
}

export type PlannerData = {
  events: PlannerEvent[]
  tasks: PlannerTask[]
  budget: PlannerBudget | null
  guests: PlannerGuest[]
  vendors: PlannerVendor[]
}

export async function getPlannerData(): Promise<PlannerData> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { events: [], tasks: [], budget: null, guests: [], vendors: [] }

  const { data: events } = await supabase
    .from('events')
    .select('id,name,event_type,event_date,guest_count,location')
    .eq('user_id', user.id)
    .order('event_date', { ascending: true, nullsFirst: false })

  const safeEvents = (events ?? []) as PlannerEvent[]
  const eventId = safeEvents[0]?.id
  if (!eventId) return { events: safeEvents, tasks: [], budget: null, guests: [], vendors: [] }

  const [{ data: tasks }, { data: budget }, { data: guests }, { data: vendors }] = await Promise.all([
    supabase.from('event_tasks').select('id,event_id,title,due_date,completed').eq('event_id', eventId).order('due_date', { ascending: true, nullsFirst: false }),
    supabase.from('budgets').select('id,event_id,total_cents,spent_cents,currency').eq('event_id', eventId).maybeSingle(),
    supabase.from('guests').select('id,event_id,name,email,rsvp_status,dietary_notes').eq('event_id', eventId).order('name'),
    supabase.from('vendors').select('id,event_id,name,category,status,quoted_cents,notes').eq('event_id', eventId).order('name'),
  ])

  return {
    events: safeEvents,
    tasks: (tasks ?? []) as PlannerTask[],
    budget: (budget as PlannerBudget | null) ?? null,
    guests: (guests ?? []) as PlannerGuest[],
    vendors: (vendors ?? []) as PlannerVendor[],
  }
}
