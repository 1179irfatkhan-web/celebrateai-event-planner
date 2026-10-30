'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowUpRight,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  CircleDollarSign,
  ClipboardCheck,
  Clock3,
  Heart,
  LayoutDashboard,
  Menu,
  MoreHorizontal,
  Plus,
  Search,
  Sparkles,
  Users,
  WandSparkles,
  X,
} from 'lucide-react'

const navItems = [
  { label: 'Overview', icon: LayoutDashboard },
  { label: 'Timeline', icon: ClipboardCheck },
  { label: 'Budget', icon: CircleDollarSign },
  { label: 'Guests', icon: Users },
  { label: 'Vendors', icon: WandSparkles },
]

const tasks = [
  { title: 'Finalize venue shortlist', meta: 'Due tomorrow', tag: 'High priority', done: false },
  { title: 'Send save-the-dates', meta: 'Due in 4 days', tag: 'Communications', done: false },
  { title: 'Review catering proposal', meta: 'Completed today', tag: 'Catering', done: true },
]

const categories = [
  { label: 'Venue & accommodation', amount: '₹1,60,000', percent: 22, color: 'bg-plum' },
  { label: 'Catering & beverages', amount: '₹2,40,000', percent: 32, color: 'bg-rose' },
  { label: 'Decor & flowers', amount: '₹1,20,000', percent: 16, color: 'bg-gold' },
  { label: 'Photography', amount: '₹64,000', percent: 9, color: 'bg-sage' },
]

export default function Page() {
  const [activeNav, setActiveNav] = useState('Overview')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showAssistant, setShowAssistant] = useState(false)
  const [query, setQuery] = useState('')
  const [completed, setCompleted] = useState<string[]>(['Review catering proposal'])
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeAssistantRef = useRef<HTMLButtonElement>(null)
  const lastAssistantTriggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!showAssistant) return

    closeAssistantRef.current?.focus()
    const dialog = dialogRef.current
    const focusable = dialog?.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowAssistant(false)
        return
      }
      if (event.key !== 'Tab' || !focusable?.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [showAssistant])

  useEffect(() => {
    if (!showAssistant) lastAssistantTriggerRef.current?.focus()
  }, [showAssistant])

  const openAssistant = (trigger: HTMLButtonElement) => {
    lastAssistantTriggerRef.current = trigger
    setShowAssistant(true)
  }

  const closeAssistant = () => setShowAssistant(false)

  const visibleTasks = useMemo(() => tasks.filter((task) => task.title.toLowerCase().includes(query.toLowerCase())), [query])

  return (
    <main className="min-h-screen bg-ivory text-ink">
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col border-r border-line bg-[#fffdf9] px-5 py-6 transition-transform lg:translate-x-0 ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2.5">
            <div className="grid size-9 place-items-center rounded-xl bg-plum text-white shadow-sm"><Heart className="size-4 fill-current" /></div>
            <div><p className="font-display text-[19px] font-semibold tracking-tight">Celebrate<span className="text-rose">AI</span></p><p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted">Event planning, elevated</p></div>
          </div>
          <button className="min-h-11 min-w-11 rounded-lg p-2 text-muted hover:bg-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum/40 lg:hidden" aria-label="Close menu" onClick={() => setIsMenuOpen(false)}><X className="size-4" /></button>
        </div>
        <div className="mt-11 flex flex-1 flex-col">
          <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink/60">Workspace</p>
          <nav className="mt-3 flex flex-col gap-1" aria-label="Workspace navigation">
            {navItems.map(({ label, icon: Icon }) => <button key={label} onClick={() => { setActiveNav(label); setIsMenuOpen(false) }} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum/40 ${activeNav === label ? 'bg-plum text-white shadow-sm' : 'text-ink/80 hover:bg-soft hover:text-ink'}`}><Icon className="size-[17px]" />{label}</button>)}
          </nav>
          <p className="mt-10 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink/60">Manage</p>
          <nav className="mt-3 flex flex-col gap-1" aria-label="Management navigation">
            <button className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-ink/80 transition hover:bg-soft hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum/40"><CalendarDays className="size-[17px]" />Events <span className="ml-auto rounded-full bg-soft px-2 py-0.5 text-[11px]">3</span></button>
            <button className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-ink/80 transition hover:bg-soft hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum/40"><Sparkles className="size-[17px]" />AI ideas</button>
          </nav>
        </div>
        <div className="rounded-2xl bg-plum px-4 py-4 text-white">
          <div className="mb-3 flex size-8 items-center justify-center rounded-lg bg-white/15"><Sparkles className="size-4" /></div>
          <p className="text-sm font-semibold">Need a fresh idea?</p><p className="mt-1 text-xs leading-5 text-white/65">Ask your planning co-pilot to make the next decision easier.</p>
          <button onClick={(event) => openAssistant(event.currentTarget)} className="mt-3 min-h-11 text-xs font-semibold text-gold hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold">Open AI co-pilot <ArrowUpRight className="ml-1 inline size-3" /></button>
        </div>
        <div className="mt-5 flex items-center gap-3 border-t border-line pt-5"><div className="grid size-9 place-items-center rounded-full bg-rose/20 text-sm font-semibold text-plum">AK</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">Aarav & Kavya</p><p className="text-xs text-muted">Personal workspace</p></div><MoreHorizontal className="size-4 text-muted" /></div>
      </aside>

      <section className="lg:pl-[248px]">
        <header className="flex h-[76px] items-center justify-between border-b border-line bg-[#fffdf9]/80 px-5 backdrop-blur md:px-10">
          <div className="flex items-center gap-3"><button className="min-h-11 min-w-11 rounded-lg p-2 hover:bg-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum/40 lg:hidden" onClick={() => setIsMenuOpen(true)} aria-label="Open menu"><Menu className="size-5" /></button><div><p className="text-xs text-muted">Wednesday, 14 August 2024</p><h1 className="mt-0.5 font-display text-[22px] font-semibold tracking-tight">Good morning, Aarav <span className="text-rose">.</span></h1></div></div>
          <div className="flex items-center gap-2 md:gap-5"><button className="hidden min-h-11 items-center gap-2 rounded-xl border border-line bg-white px-3 py-2 text-xs text-muted shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum/40 sm:flex"><Search className="size-3.5" /> Search <span className="rounded bg-soft px-1.5 py-0.5 text-[10px]">⌘ K</span></button><button className="relative min-h-11 min-w-11 rounded-xl p-2 text-muted hover:bg-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum/40" aria-label="Notifications"><Bell className="size-[18px]" /><span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-rose" /></button><div className="hidden h-7 w-px bg-line md:block" /><button className="flex min-h-11 items-center gap-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum/40" aria-label="Open account menu"><span className="grid size-8 place-items-center rounded-full bg-rose/20 text-xs font-semibold text-plum">AK</span><ChevronDown className="size-3.5 text-muted" /></button></div>
        </header>

        <div className="mx-auto max-w-[1440px] px-5 py-7 md:px-10 md:py-9">
          <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><div className="mb-2 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-2.5 py-1 text-[11px] font-semibold text-plum"><span className="size-1.5 rounded-full bg-gold" /> Demo workspace</div><h2 className="font-display text-3xl font-semibold tracking-tight md:text-[34px]">Your celebration, <span className="italic text-rose">beautifully planned.</span></h2><p className="mt-2 text-sm text-muted">A clear view of what matters next for your big day.</p></div><button onClick={(event) => openAssistant(event.currentTarget)} className="inline-flex min-h-11 w-fit items-center gap-2 rounded-xl bg-plum px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-plum/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum/40"><Sparkles className="size-4 text-gold" /> Ask CelebrateAI</button></div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric icon={CalendarDays} label="Next event" value="126 days" detail="14 December 2024" accent="rose" /><Metric icon={CircleDollarSign} label="Budget remaining" value="₹2,16,000" detail="72% allocated" accent="gold" /><Metric icon={ClipboardCheck} label="Open tasks" value="18" detail="3 due this week" accent="plum" /><Metric icon={Users} label="Guest responses" value="68%" detail="170 of 250 invited" accent="sage" /></div>

          <div className="mt-7 grid gap-6 xl:grid-cols-[1.45fr_1fr]">
            <section className="rounded-2xl border border-line bg-white p-5 shadow-card md:p-6"><div className="flex items-start justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Featured event</p><h3 className="mt-1.5 font-display text-2xl font-semibold">Kavya & Aarav&apos;s Wedding</h3><p className="mt-1 text-sm text-muted">14 December 2024 · Ahmedabad, Gujarat</p></div><button className="rounded-lg p-2 text-muted hover:bg-soft" aria-label="More event options"><MoreHorizontal className="size-4" /></button></div><div className="mt-6 flex flex-col gap-6 rounded-xl bg-[#fcf8f3] p-4 md:flex-row md:items-center"><div role="img" aria-label="Wedding planning progress: 68 percent complete" className="relative grid size-[116px] shrink-0 place-items-center rounded-full" style={{ background: 'conic-gradient(#7f304f 0 68%, #eadccf 68% 100%)' }}><div className="grid size-[88px] place-items-center rounded-full bg-[#fcf8f3]"><span className="font-display text-2xl font-semibold">68<span className="text-base">%</span></span></div></div><div className="flex-1"><p className="text-sm font-semibold">You&apos;re off to a wonderful start</p><p className="mt-1 text-xs leading-5 text-muted">12 of 18 planning milestones are in motion. Keep the momentum going.</p><div className="mt-4 flex flex-wrap gap-2"><StatusPill label="Gujarati-inspired" /><StatusPill label="250 guests" /><StatusPill label="Vegetarian" /></div></div><button className="flex shrink-0 items-center gap-1 text-xs font-semibold text-plum">View workspace <ArrowUpRight className="size-3.5" /></button></div><div className="mt-6 grid grid-cols-3 gap-3 border-t border-line pt-5 text-center"><MiniStat value="12" label="Milestones" /><MiniStat value="₹5.84L" label="Allocated" /><MiniStat value="170" label="Guests invited" /></div></section>

            <section className="rounded-2xl border border-line bg-white p-5 shadow-card md:p-6"><div className="flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Planning pulse</p><h3 className="mt-1.5 font-display text-2xl font-semibold">Budget overview</h3></div><button className="rounded-lg p-2 text-muted hover:bg-soft" aria-label="Budget options"><MoreHorizontal className="size-4" /></button></div><div className="mt-6 flex items-center gap-5"><div role="img" aria-label="Budget allocated: 73 percent, remaining: 27 percent" className="relative grid size-[106px] shrink-0 place-items-center rounded-full" style={{ background: 'conic-gradient(#7f304f 0 73%, #dcae51 73% 86%, #d8e0d7 86% 100%)' }}><div className="grid size-[78px] place-items-center rounded-full bg-white"><span className="font-display text-xl font-semibold">73<span className="text-sm">%</span></span></div></div><div><p className="font-display text-2xl font-semibold">₹5,84,000</p><p className="text-xs text-muted">of ₹8,00,000 allocated</p><p className="mt-2 text-xs font-medium text-sage">₹2,16,000 remaining</p></div></div><div className="mt-6 flex flex-col gap-3">{categories.map((item) => <div key={item.label}><div className="mb-1 flex justify-between text-xs"><span className="text-muted">{item.label}</span><span className="font-semibold">{item.amount}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-soft"><div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.percent * 2.6}%` }} /></div></div>)}</div><button className="mt-5 flex w-full items-center justify-center gap-1 rounded-xl border border-line py-2.5 text-xs font-semibold text-plum hover:bg-soft">Review full budget <ArrowUpRight className="size-3.5" /></button></section>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <section className="rounded-2xl border border-line bg-white p-5 shadow-card md:p-6"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Your week at a glance</p><h3 className="mt-1.5 font-display text-2xl font-semibold">Next steps</h3></div><div className="flex items-center gap-2"><div className="relative"><Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted" /><input aria-label="Filter tasks" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter tasks" className="w-32 rounded-lg border border-line bg-ivory py-2 pl-8 pr-2 text-xs outline-none placeholder:text-muted focus:ring-2 focus:ring-rose/30" /></div><button className="grid size-8 place-items-center rounded-lg bg-plum text-white" aria-label="Add task"><Plus className="size-4" /></button></div></div><div className="mt-5 flex flex-col divide-y divide-line">{visibleTasks.map((task) => { const isDone = completed.includes(task.title); return <div key={task.title} className="flex items-center gap-3 py-3.5 first:pt-0"><button onClick={() => setCompleted((current) => isDone ? current.filter((title) => title !== task.title) : [...current, task.title])} className={`grid size-5 shrink-0 place-items-center rounded-md border ${isDone ? 'border-sage bg-sage text-white' : 'border-line bg-white'}`} aria-label={`${isDone ? 'Mark incomplete' : 'Mark complete'}: ${task.title}`}>{isDone && <Check className="size-3.5" />}</button><div className="min-w-0 flex-1"><p className={`text-sm font-medium ${isDone ? 'text-muted line-through' : ''}`}>{task.title}</p><p className="mt-0.5 text-xs text-muted">{task.meta}</p></div><span className="hidden rounded-full bg-soft px-2.5 py-1 text-[10px] font-medium text-muted sm:block">{task.tag}</span><MoreHorizontal className="size-4 text-muted" /></div>})}</div><button className="mt-3 text-xs font-semibold text-plum">View all tasks <ArrowUpRight className="ml-1 inline size-3.5" /></button></section>
            <section className="overflow-hidden rounded-2xl bg-plum p-6 text-white shadow-card"><div className="flex items-start justify-between"><div className="grid size-10 place-items-center rounded-xl bg-white/10"><Sparkles className="size-5 text-gold" /></div><span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/70">AI insight</span></div><p className="mt-6 font-display text-2xl font-semibold leading-tight">Your catering decision is the next big unlock.</p><p className="mt-3 text-sm leading-6 text-white/65">Based on your guest count and vegetarian menu, locking a caterer this week could protect your current ₹2.4L allocation.</p><button onClick={(event) => openAssistant(event.currentTarget)} className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-gold px-4 py-2.5 text-xs font-bold text-plum transition hover:bg-[#e7c675] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold">Explore recommendations <ArrowUpRight className="size-3.5" /></button><div className="pointer-events-none absolute hidden" /></section>
          </div>
        </div>
      </section>

      {showAssistant && <div className="fixed inset-0 z-50 flex items-end justify-end bg-ink/20 p-4 backdrop-blur-sm md:items-center md:p-8" onMouseDown={(event) => { if (event.target === event.currentTarget) closeAssistant() }}><div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="assistant-title" className="w-full max-w-md rounded-2xl border border-line bg-white p-6 shadow-2xl"><div className="flex items-start justify-between"><div><div className="mb-3 grid size-10 place-items-center rounded-xl bg-plum text-gold"><Sparkles className="size-5" /></div><h2 id="assistant-title" className="font-display text-2xl font-semibold">Ask CelebrateAI</h2><p className="mt-1 text-sm text-muted">A planning suggestion for your wedding context.</p></div><button ref={closeAssistantRef} onClick={closeAssistant} className="min-h-11 min-w-11 rounded-lg p-2 text-muted hover:bg-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum/40" aria-label="Close assistant"><X className="size-4" /></button></div><div className="mt-6 rounded-xl bg-[#fcf8f3] p-4"><p className="text-sm leading-6">For 250 vegetarian guests, request a menu tasting with two caterers before committing. Compare per-plate inclusions, service staff, and late-night snacks. This keeps your guest experience strong without changing your budget.</p><p className="mt-3 text-[11px] text-muted">Demo suggestion · Review before saving to your plan</p></div><div className="mt-5 flex gap-2"><button onClick={closeAssistant} className="min-h-11 flex-1 rounded-xl border border-line py-2.5 text-sm font-semibold text-muted hover:bg-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum/40">Maybe later</button><button onClick={closeAssistant} className="min-h-11 flex-1 rounded-xl bg-plum py-2.5 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum/40">Save idea</button></div></div></div>}
    </main>
  )
}

function Metric({ icon: Icon, label, value, detail, accent }: { icon: typeof CalendarDays; label: string; value: string; detail: string; accent: string }) { return <div className="rounded-2xl border border-line bg-white p-4 shadow-card"><div className="flex items-start justify-between"><span className={`grid size-8 place-items-center rounded-lg ${accent === 'rose' ? 'bg-rose/15 text-rose' : accent === 'gold' ? 'bg-gold/15 text-gold' : accent === 'sage' ? 'bg-sage/20 text-sage' : 'bg-plum/10 text-plum'}`}><Icon className="size-4" /></span><ArrowUpRight className="size-3.5 text-muted" /></div><p className="mt-4 text-xs text-muted">{label}</p><p className="mt-1 font-display text-2xl font-semibold">{value}</p><p className="mt-1 text-[11px] text-muted">{detail}</p></div> }
function StatusPill({ label }: { label: string }) { return <span className="rounded-full border border-line bg-white px-2.5 py-1 text-[10px] font-medium text-muted">{label}</span> }
function MiniStat({ value, label }: { value: string; label: string }) { return <div><p className="font-display text-lg font-semibold">{value}</p><p className="mt-0.5 text-[10px] uppercase tracking-wider text-muted">{label}</p></div> }
