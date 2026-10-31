import { DemoAuthGate } from '@/components/demo-auth-gate'
import Link from 'next/link'
import { ArrowLeft, ArrowUpRight, CalendarDays, CircleDollarSign, ClipboardCheck, Users, WandSparkles } from 'lucide-react'

const icons = { Events: CalendarDays, Timeline: ClipboardCheck, Budget: CircleDollarSign, Guests: Users, Vendors: WandSparkles }

type WorkspacePageProps = { title: keyof typeof icons; eyebrow: string; description: string; items: string[] }

export function WorkspacePage({ title, eyebrow, description, items }: WorkspacePageProps) {
  const Icon = icons[title]
  return <DemoAuthGate><main className="min-h-screen bg-ivory px-5 py-8 text-ink md:px-10 md:py-12"><div className="mx-auto max-w-5xl"><Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-plum hover:underline"><ArrowLeft className="size-4" /> Back to overview</Link><div className="mt-10 flex items-start gap-4"><div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-plum text-gold"><Icon className="size-5" /></div><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{eyebrow}</p><h1 className="mt-1 font-display text-4xl font-semibold">{title}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{description}</p></div></div><section className="mt-8 rounded-2xl border border-line bg-white p-6 shadow-card"><div className="flex items-center justify-between gap-4"><div><h2 className="font-display text-2xl font-semibold">Your {title.toLowerCase()}</h2><p className="mt-1 text-sm text-muted">The route is connected and ready for authenticated workspace data.</p></div><span className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-plum px-4 py-2.5 text-sm font-semibold text-white"><span>Coming with workspace data</span><ArrowUpRight className="size-4" aria-hidden="true" /></span></div><div className="mt-6 grid gap-3 sm:grid-cols-2">{items.map((item) => <div key={item} className="rounded-xl border border-line bg-[#fcf8f3] p-4"><p className="text-sm font-semibold">{item}</p><p className="mt-1 text-xs text-muted">Connect this view to your saved event data when the workspace schema is available.</p></div>)}</div></section></div></main></DemoAuthGate>
}
