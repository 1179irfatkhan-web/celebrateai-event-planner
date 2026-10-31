import { createClient } from '@/lib/supabase/server'

export type PlannerEvent = { id: string; name: string; event_type: string; event_date: string | null; guest_count: number; location: string | null; total_budget_cents: number }
export type PlannerTask = { id: string; event_id: string; title: string; due_date: string | null; completed: boolean; priority: 'low' | 'medium' | 'high'; status: 'open' | 'completed' }
export type PlannerBudget = { id: string; event_id: string; total_cents: number; spent_cents: number; currency: string }
export type PlannerGuest = { id: string; event_id: string; name: string; email: string | null; rsvp_status: 'pending' | 'attending' | 'declined'; dietary_notes: string | null }
export type PlannerVendor = { id: string; event_id: string; name: string; category: string; status: 'researching' | 'contacted' | 'booked'; quoted_cents: number | null; estimated_cents: number | null; actual_cents: number | null; contact_email: string | null; contact_phone: string | null; notes: string | null }
export type PlannerCategory = { id: string; event_id: string; name: string; planned_cents: number; actual_cents: number }
export type PlannerSuggestion = { id: string; event_id: string; title: string; description: string; category: string; source: string; dismissed: boolean }
export type PlannerData = { events: PlannerEvent[]; tasks: PlannerTask[]; budget: PlannerBudget | null; guests: PlannerGuest[]; vendors: PlannerVendor[]; categories: PlannerCategory[]; suggestions: PlannerSuggestion[] }

export async function getPlannerData(): Promise<PlannerData> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const empty = { events: [], tasks: [], budget: null, guests: [], vendors: [], categories: [], suggestions: [] } as PlannerData
  if (!user) return empty
  const { data: events } = await supabase.from('events').select('id,name,event_type,event_date,guest_count,location,total_budget_cents').eq('user_id', user.id).order('event_date', { ascending: true, nullsFirst: false })
  const safeEvents = (events ?? []) as PlannerEvent[]
  const eventId = safeEvents[0]?.id
  if (!eventId) return { ...empty, events: safeEvents }
  const [{ data: tasks }, { data: budget }, { data: guests }, { data: vendors }, { data: categories }, { data: suggestions }] = await Promise.all([
    supabase.from('event_tasks').select('id,event_id,title,due_date,completed,priority,status').eq('event_id', eventId).order('completed').order('due_date', { ascending: true, nullsFirst: false }),
    supabase.from('budgets').select('id,event_id,total_cents,spent_cents,currency').eq('event_id', eventId).maybeSingle(),
    supabase.from('guests').select('id,event_id,name,email,rsvp_status,dietary_notes').eq('event_id', eventId).order('name'),
    supabase.from('vendors').select('id,event_id,name,category,status,quoted_cents,estimated_cents,actual_cents,contact_email,contact_phone,notes').eq('event_id', eventId).order('name'),
    supabase.from('budget_categories').select('id,event_id,name,planned_cents,actual_cents').eq('event_id', eventId).order('name'),
    supabase.from('ai_suggestions').select('id,event_id,title,description,category,source,dismissed').eq('event_id', eventId).eq('dismissed', false).order('created_at', { ascending: false }),
  ])
  return { events: safeEvents, tasks: (tasks ?? []) as PlannerTask[], budget: (budget as PlannerBudget | null) ?? null, guests: (guests ?? []) as PlannerGuest[], vendors: (vendors ?? []) as PlannerVendor[], categories: (categories ?? []) as PlannerCategory[], suggestions: (suggestions ?? []) as PlannerSuggestion[] }
}
