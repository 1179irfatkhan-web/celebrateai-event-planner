'use client'

import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'

function loginErrorMessage(error: unknown): string {
  const { code, status } = (error ?? {}) as { code?: string; status?: number }
  if (code === 'email_not_confirmed') return 'Please confirm your email address before signing in.'
  if (code === 'over_request_rate_limit' || status === 429) return 'Too many attempts. Please wait a moment and try again.'
  if (code === 'invalid_credentials') return 'Invalid email or password.'
  return 'Something went wrong. Please try again.'
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isLoading) return
    setError('')
    if (!email.trim() || !password) {
      setError('Enter your email and password.')
      return
    }
    setIsLoading(true)
    try {
      const { error: authError } = await createClient().auth.signInWithPassword({ email: email.trim(), password })
      if (authError) throw authError
      router.replace('/')
      router.refresh()
    } catch (authError) {
      setError(loginErrorMessage(authError))
    } finally {
      setIsLoading(false)
    }
  }

  return <main className="flex min-h-screen items-center justify-center bg-ivory px-5 py-10 text-ink"><section className="w-full max-w-md rounded-2xl border border-line bg-white p-6 shadow-card md:p-8"><div className="mb-8"><Link href="/" className="font-display text-2xl font-semibold">Celebrate<span className="text-rose">AI</span></Link><p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-muted">Welcome back</p><h1 className="mt-2 font-display text-3xl font-semibold">Sign in to your workspace</h1><p className="mt-2 text-sm leading-6 text-muted">Continue planning your celebration with your saved workspace.</p></div><form onSubmit={handleSubmit} noValidate className="space-y-5"><div><label htmlFor="email" className="mb-2 block text-sm font-medium">Email</label><input id="email" name="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="min-h-11 w-full rounded-xl border border-line bg-ivory px-3 text-sm outline-none focus:ring-2 focus:ring-plum/30" /></div><div><label htmlFor="password" className="mb-2 block text-sm font-medium">Password</label><input id="password" name="password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="min-h-11 w-full rounded-xl border border-line bg-ivory px-3 text-sm outline-none focus:ring-2 focus:ring-plum/30" /></div>{error && <p role="alert" className="rounded-lg border border-rose/30 bg-rose/10 px-3 py-2 text-sm text-plum">{error}</p>}<button type="submit" disabled={isLoading} className="min-h-11 w-full rounded-xl bg-plum px-4 py-2.5 text-sm font-semibold text-white hover:bg-plum/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum/40 disabled:cursor-not-allowed disabled:opacity-60">{isLoading ? 'Signing in…' : 'Sign in'}</button></form><p className="mt-6 text-center text-sm text-muted">New to CelebrateAI? <Link href="/auth/sign-up" className="font-semibold text-plum underline-offset-4 hover:underline">Create an account</Link></p></section></main>
}
