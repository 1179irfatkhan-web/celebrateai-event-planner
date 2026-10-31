'use client'

import { DEMO_EMAIL, DEMO_PASSWORD } from '@/lib/demo-auth'
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
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)

  async function signIn(emailValue: string, passwordValue: string) {
    setError('')
    setSuccess('')
    setIsLoading(true)
    try {
      const { error: authError } = await createClient().auth.signInWithPassword({
        email: emailValue.trim(),
        password: passwordValue,
      })
      if (authError) throw authError
      router.replace('/')
      router.refresh()
    } catch (authError) {
      setError(loginErrorMessage(authError))
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isLoading) return
    if (!email.trim() || !password) {
      setError('Enter your email and password.')
      return
    }
    await signIn(email, password)
  }

  async function handleDemoLogin() {
    if (isLoading) return
    setEmail(DEMO_EMAIL)
    setPassword(DEMO_PASSWORD)
    await signIn(DEMO_EMAIL, DEMO_PASSWORD)
  }

  async function handleResendConfirmation() {
    if (!email.trim() || isResending) return
    setIsResending(true)
    setError('')
    setSuccess('')
    const { error: resendError } = await createClient().auth.resend({
      type: 'signup',
      email: email.trim(),
      options: {
        emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? `${window.location.origin}/auth/callback`,
      },
    })
    if (resendError) setError('We could not resend the confirmation email. Please try again shortly.')
    else setSuccess('Confirmation email sent. Check your inbox, then sign in again.')
    setIsResending(false)
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-ivory px-5 py-10 text-ink">
      <section className="w-full max-w-md rounded-2xl border border-line bg-white p-6 shadow-card md:p-8">
        <div className="mb-8">
          <Link href="/" className="font-display text-2xl font-semibold">Celebrate<span className="text-rose">AI</span></Link>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-muted">Welcome back</p>
          <h1 className="mt-2 font-display text-3xl font-semibold">Sign in to your workspace</h1>
          <p className="mt-2 text-sm leading-6 text-muted">Continue planning your celebration with your saved workspace.</p>
        </div>

        <div className="mb-5 rounded-xl border border-gold/40 bg-gold/10 px-3 py-2.5 text-xs font-medium text-plum">
          Hackathon demo access is configured through the existing Supabase authentication flow.
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium">Email</label>
            <input id="email" name="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="min-h-11 w-full rounded-xl border border-line bg-ivory px-3 text-sm outline-none focus:ring-2 focus:ring-plum/30" />
          </div>
          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium">Password</label>
            <input id="password" name="password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="min-h-11 w-full rounded-xl border border-line bg-ivory px-3 text-sm outline-none focus:ring-2 focus:ring-plum/30" />
          </div>
          {error && <div role="alert" className="rounded-lg border border-rose/30 bg-rose/10 px-3 py-2 text-sm text-plum"><p>{error}</p>{error === 'Please confirm your email address before signing in.' && <button type="button" onClick={() => void handleResendConfirmation()} disabled={isResending || !email.trim()} className="mt-2 font-semibold underline disabled:cursor-not-allowed disabled:opacity-60">{isResending ? 'Resending…' : 'Resend confirmation email'}</button>}</div>}
          {success && <p role="status" className="rounded-lg border border-gold/40 bg-gold/10 px-3 py-2 text-sm text-plum">{success}</p>}
          <button type="submit" disabled={isLoading} className="min-h-11 w-full rounded-xl bg-plum px-4 py-2.5 text-sm font-semibold text-white hover:bg-plum/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum/40 disabled:cursor-not-allowed disabled:opacity-60">{isLoading ? 'Signing in…' : 'Sign in'}</button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs text-muted"><span className="h-px flex-1 bg-line" />or<span className="h-px flex-1 bg-line" /></div>
        <button type="button" onClick={() => void handleDemoLogin()} disabled={isLoading} className="min-h-11 w-full rounded-xl border border-plum/30 bg-white px-4 py-2.5 text-sm font-semibold text-plum hover:bg-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum/40 disabled:cursor-not-allowed disabled:opacity-60">{isLoading ? 'Opening demo workspace…' : 'Try Demo Account'}</button>
        <p className="mt-2 text-center text-xs text-muted">Uses the configured `demo@celebrateai.com` account through Supabase.</p>
        <p className="mt-6 text-center text-sm text-muted">New to CelebrateAI? <Link href="/auth/sign-up" className="font-semibold text-plum hover:underline">Create an account</Link></p>
      </section>
    </main>
  )
}
