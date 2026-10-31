import Link from 'next/link'

export default function SignUpSuccessPage() {
  return <main className="flex min-h-screen items-center justify-center bg-ivory px-5 py-10 text-ink"><section className="w-full max-w-md rounded-2xl border border-line bg-white p-8 text-center shadow-card"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Almost there</p><h1 className="mt-3 font-display text-3xl font-semibold">Check your inbox</h1><p className="mt-3 text-sm leading-6 text-muted">We sent a confirmation link to your email. Confirm it before signing in.</p><Link href="/auth/login" className="mt-7 inline-flex min-h-11 items-center justify-center rounded-xl bg-plum px-4 py-2.5 text-sm font-semibold text-white">Return to sign in</Link></section></main>
}
