import Link from 'next/link'

export default function AuthErrorPage() {
  return <main className="flex min-h-screen items-center justify-center bg-ivory px-5 py-10 text-ink"><section className="w-full max-w-md rounded-2xl border border-line bg-white p-8 text-center shadow-card"><h1 className="font-display text-3xl font-semibold">We couldn&apos;t complete that sign-in</h1><p className="mt-3 text-sm leading-6 text-muted">The authentication link may have expired. Start again from the sign-in page.</p><Link href="/auth/login" className="mt-7 inline-flex min-h-11 items-center justify-center rounded-xl bg-plum px-4 py-2.5 text-sm font-semibold text-white">Go to sign in</Link></section></main>
}
