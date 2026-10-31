'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, CalendarDays, Check, CircleDollarSign, ClipboardCheck, Plus, Users, WandSparkles } from 'lucide-react'
import type { PlannerData, PlannerEvent, PlannerGuest, PlannerTask, PlannerVendor } from '@/lib/planner-data'

type PlannerKind = 'Events' | 'Timeline' | 'Budget' | 'Guests' | 'Vendors'
const icons = { Events: CalendarDays, Timeline: ClipboardCheck, Budget: CircleDollarSign, Guests: Users, Vendors: WandSparkles }

async function mutate(payload: Record<string, unknown>) {
  const response = await fetch('/api/planner', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
  const data = await response.json().catch(() => null)
  if (!response.ok) throw new Error(data?.error || 'Could not save this change.')
  return data
}

export function PlannerWorkspace({ kind, data }: { kind: PlannerKind; data: PlannerData }) {
  const [planner, setPlanner] = useState(data)
  const [selectedEventId, setSelectedEventId] = useState(data.events[0]?.id ?? '')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [draft, setDraft] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [vendorCategory, setVendorCategory] = useState('Other')
  const [eventName, setEventName] = useState('')
  const Icon = icons[kind]
  const event = planner.events.find((item) => item.id === selectedEventId) ?? planner.events[0]

  const run = async (action: Record<string, unknown>) => {
    setBusy(true); setError('')
    try {
      const result = await mutate({ ...action, event_id: event?.id })
      if (result.event) setPlanner((current) => ({ ...current, events: action.action === 'update_event' ? current.events.map((item) => item.id === result.event.id ? result.event : item) : [...current.events, result.event] }))
      if (result.deleted && action.action === 'delete_event') setPlanner((current) => ({ ...current, events: current.events.filter((item) => item.id !== result.deleted) }))
      if (result.task) setPlanner((current) => ({ ...current, tasks: action.action === 'update_task' ? current.tasks.map((item) => item.id === result.task.id ? result.task : item) : [...current.tasks, result.task] }))
      if (result.deleted && action.action === 'delete_task') setPlanner((current) => ({ ...current, tasks: current.tasks.filter((item) => item.id !== result.deleted) }))
      if (result.guest) setPlanner((current) => ({ ...current, guests: action.action === 'update_guest' ? current.guests.map((item) => item.id === result.guest.id ? result.guest : item) : [...current.guests, result.guest] }))
      if (result.deleted && action.action === 'delete_guest') setPlanner((current) => ({ ...current, guests: current.guests.filter((item) => item.id !== result.deleted) }))
      if (result.vendor) setPlanner((current) => ({ ...current, vendors: action.action === 'update_vendor' ? current.vendors.map((item) => item.id === result.vendor.id ? result.vendor : item) : [...current.vendors, result.vendor] }))
      if (result.deleted && action.action === 'delete_vendor') setPlanner((current) => ({ ...current, vendors: current.vendors.filter((item) => item.id !== result.deleted) }))
      if (result.budget) setPlanner((current) => ({ ...current, budget: result.budget }))
      if (result.task?.id && action.action === 'update_task') setPlanner((current) => ({ ...current, tasks: current.tasks.map((task) => task.id === result.task.id ? result.task : task) }))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not save this change.')
    } finally { setBusy(false) }
  }

  const addItem = async () => {
    if (!draft.trim() || !event) return
    if (kind === 'Timeline') await run({ action: 'create_task', title: draft })
    if (kind === 'Guests') await run({ action: 'create_guest', name: draft, email: guestEmail })
    if (kind === 'Vendors') await run({ action: 'create_vendor', name: draft, category: vendorCategory })
    setDraft(''); setGuestEmail('')
  }

  return <main className="min-h-screen bg-ivory px-5 py-8 text-ink md:px-10 md:py-12"><div className="mx-auto max-w-5xl">
    <Link href="/" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-plum hover:underline"><ArrowLeft className="size-4" /> Back to overview</Link>
    <div className="mt-8 flex items-start gap-4"><div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-plum text-gold"><Icon className="size-5" /></div><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{kind === 'Events' ? 'Manage' : 'Workspace'}</p><h1 className="mt-1 font-display text-4xl font-semibold">{kind}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Manage saved planning data for your authenticated event workspace.</p></div></div>
    {error && <p role="alert" className="mt-5 rounded-xl border border-rose/30 bg-rose/10 px-4 py-3 text-sm text-plum">{error}</p>}
    {kind === 'Events' ? <EventsPanel events={planner.events} eventName={eventName} setEventName={setEventName} busy={busy} onCreate={() => run({ action: 'create_event', name: eventName })} onSelect={setSelectedEventId} onDelete={(id) => run({ action: 'delete_event', event_id: id })} /> : <>
      <div className="mt-8 flex flex-col gap-3 rounded-2xl border border-line bg-white p-5 shadow-card sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Active event</p><h2 className="mt-1 font-display text-2xl font-semibold">{event?.name ?? 'Create an event first'}</h2><p className="mt-1 text-sm text-muted">{event?.location || 'Your saved planning records will appear here.'}</p></div><select aria-label="Select event" value={selectedEventId} onChange={(e) => setSelectedEventId(e.target.value)} className="min-h-11 rounded-xl border border-line bg-ivory px-3 text-sm" disabled={!planner.events.length}>{planner.events.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
      {kind === 'Budget' ? <BudgetPanel budget={planner.budget} busy={busy} onSave={(total, spent) => run({ action: 'update_budget', total_cents: total, spent_cents: spent })} /> : kind === 'Timeline' ? <TaskPanel tasks={planner.tasks} busy={busy} onToggle={(task) => run({ action: 'update_task', task_id: task.id, completed: !task.completed })} onDelete={(id) => run({ action: 'delete_task', task_id: id })} /> : kind === 'Guests' ? <GuestPanel guests={planner.guests} onDelete={(id) => run({ action: 'delete_guest', guest_id: id })} /> : <VendorPanel vendors={planner.vendors} onDelete={(id) => run({ action: 'delete_vendor', vendor_id: id })} />}
      {kind !== 'Budget' && <section className="mt-5 rounded-2xl border border-line bg-white p-5 shadow-card"><h2 className="font-display text-2xl font-semibold">Add {kind === 'Timeline' ? 'a task' : kind === 'Guests' ? 'a guest' : 'a vendor'}</h2><div className="mt-4 flex flex-col gap-3 sm:flex-row"><input aria-label={`New ${kind === 'Timeline' ? 'task' : kind === 'Guests' ? 'guest' : 'vendor'}`} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={kind === 'Timeline' ? 'Finalize venue shortlist' : kind === 'Guests' ? 'Guest name' : 'Vendor name'} className="min-h-11 flex-1 rounded-xl border border-line bg-ivory px-3 text-sm" />{kind === 'Guests' && <input aria-label="Guest email" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} placeholder="Email (optional)" className="min-h-11 flex-1 rounded-xl border border-line bg-ivory px-3 text-sm" />}{kind === 'Vendors' && <select aria-label="Vendor category" value={vendorCategory} onChange={(e) => setVendorCategory(e.target.value)} className="min-h-11 rounded-xl border border-line bg-ivory px-3 text-sm"><option>Other</option><option>Venue</option><option>Catering</option><option>Photography</option><option>Decor</option></select>}<button type="button" onClick={() => void addItem()} disabled={busy || !event} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-plum px-4 text-sm font-semibold text-white disabled:opacity-50"><Plus className="size-4" /> Add</button></div></section>}
    </>}</div></main>
}

function EventsPanel({ events, eventName, setEventName, busy, onCreate, onSelect, onDelete }: { events: PlannerEvent[]; eventName: string; setEventName: (value: string) => void; busy: boolean; onCreate: () => void; onSelect: (id: string) => void; onDelete: (id: string) => void }) { return <section className="mt-8 rounded-2xl border border-line bg-white p-5 shadow-card"><div className="flex flex-col gap-3 sm:flex-row"><input aria-label="New event name" value={eventName} onChange={(e) => setEventName(e.target.value)} placeholder="Kavya & Aarav's Wedding" className="min-h-11 flex-1 rounded-xl border border-line bg-ivory px-3 text-sm" /><button type="button" onClick={onCreate} disabled={busy || !eventName.trim()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-plum px-4 text-sm font-semibold text-white disabled:opacity-50"><Plus className="size-4" /> Create event</button></div><div className="mt-5 grid gap-3 sm:grid-cols-2">{events.map((item) => <div key={item.id} className="flex items-center gap-2 rounded-xl border border-line bg-[#fcf8f3] p-4"><button type="button" onClick={() => onSelect(item.id)} className="min-w-0 flex-1 text-left hover:border-plum"><p className="font-semibold">{item.name}</p><p className="mt-1 text-xs text-muted">{item.event_type}{item.event_date ? ` · ${item.event_date}` : ''}{item.location ? ` · ${item.location}` : ''}</p></button><button type="button" onClick={() => onDelete(item.id)} disabled={busy} className="min-h-10 rounded-lg px-2 text-xs font-semibold text-muted hover:bg-rose/10 hover:text-plum" aria-label={`Delete ${item.name}`}>Delete</button></div>)}{!events.length && <p className="text-sm text-muted">No events yet. Create your first event to start planning.</p>}</div></section> }
function BudgetPanel({ budget, busy, onSave }: { budget: PlannerData['budget']; busy: boolean; onSave: (total: number, spent: number) => void }) { const [total, setTotal] = useState(String(Math.round((budget?.total_cents ?? 0) / 100))); const [spent, setSpent] = useState(String(Math.round((budget?.spent_cents ?? 0) / 100))); return <section className="mt-5 rounded-2xl border border-line bg-white p-5 shadow-card"><h2 className="font-display text-2xl font-semibold">Budget control</h2><div className="mt-4 grid gap-3 sm:grid-cols-3"><label className="text-sm">Total<input type="number" min="0" value={total} onChange={(e) => setTotal(e.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-line bg-ivory px-3" /></label><label className="text-sm">Spent<input type="number" min="0" value={spent} onChange={(e) => setSpent(e.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-line bg-ivory px-3" /></label><button type="button" disabled={busy} onClick={() => onSave(Math.round(Number(total) * 100), Math.round(Number(spent) * 100))} className="self-end min-h-11 rounded-xl bg-plum px-4 text-sm font-semibold text-white disabled:opacity-50">Save budget</button></div></section> }
function TaskPanel({ tasks, busy, onToggle, onDelete }: { tasks: PlannerTask[]; busy: boolean; onToggle: (task: PlannerTask) => void; onDelete: (id: string) => void }) { return <section className="mt-5 rounded-2xl border border-line bg-white p-5 shadow-card"><h2 className="font-display text-2xl font-semibold">Planning tasks</h2><div className="mt-4 divide-y divide-line">{tasks.map((task) => <label key={task.id} className="flex min-h-14 items-center gap-3 py-3 text-sm"><input type="checkbox" checked={task.completed} disabled={busy} onChange={() => onToggle(task)} className="size-4 accent-plum" /><span className={task.completed ? 'text-muted line-through' : 'font-medium'}>{task.title}</span>{task.due_date && <span className="ml-auto text-xs text-muted">{task.due_date}</span>}<button type="button" onClick={() => onDelete(task.id)} disabled={busy} className="rounded px-2 py-1 text-xs text-muted hover:bg-rose/10 hover:text-plum" aria-label={`Delete ${task.title}`}>Delete</button></label>)}{!tasks.length && <p className="py-4 text-sm text-muted">No saved tasks yet.</p>}</div></section> }
function GuestPanel({ guests, onDelete }: { guests: PlannerGuest[]; onDelete: (id: string) => void }) { return <section className="mt-5 rounded-2xl border border-line bg-white p-5 shadow-card"><h2 className="font-display text-2xl font-semibold">Guest list</h2><div className="mt-4 divide-y divide-line">{guests.map((guest) => <div key={guest.id} className="flex items-center justify-between gap-3 py-3 text-sm"><span className="font-medium">{guest.name}<span className="ml-2 text-xs text-muted">{guest.email}</span></span><span className="rounded-full bg-soft px-2 py-1 text-xs capitalize">{guest.rsvp_status}</span><button type="button" onClick={() => onDelete(guest.id)} className="rounded px-2 py-1 text-xs text-muted hover:bg-rose/10 hover:text-plum" aria-label={`Delete ${guest.name}`}>Delete</button></div>)}{!guests.length && <p className="py-4 text-sm text-muted">No saved guests yet.</p>}</div></section> }
function VendorPanel({ vendors, onDelete }: { vendors: PlannerVendor[]; onDelete: (id: string) => void }) { return <section className="mt-5 rounded-2xl border border-line bg-white p-5 shadow-card"><h2 className="font-display text-2xl font-semibold">Vendor shortlist</h2><div className="mt-4 divide-y divide-line">{vendors.map((vendor) => <div key={vendor.id} className="flex items-center justify-between gap-3 py-3 text-sm"><span className="font-medium">{vendor.name}<span className="ml-2 text-xs text-muted">{vendor.category}</span></span><span className="rounded-full bg-soft px-2 py-1 text-xs capitalize">{vendor.status}</span><button type="button" onClick={() => onDelete(vendor.id)} className="rounded px-2 py-1 text-xs text-muted hover:bg-rose/10 hover:text-plum" aria-label={`Delete ${vendor.name}`}>Delete</button></div>)}{!vendors.length && <p className="py-4 text-sm text-muted">No saved vendors yet.</p>}</div></section> }
