'use client'

import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'

function signUpErrorMessage(error: unknown): string {
  const { code, status } = (error ?? {}) as { code?: string; status?: number }
  if (code === 'weak_password') return 'Choose a stronger password.'
  if (code === 'email_address_invalid') return 'Enter a valid email address.'
  if (code === 'email_address_not_authorized') return 'That address cannot receive confirmation email in this project.'
  if (code === 'over_email_send_rate_limit' || status === 429) return 'Too many attempts. Please wait a moment and try again.'
  return 'Unable to create the account. Please try again.'
}

export default function SignUpPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [repeatPassword, setRepeatPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isLoading) return
    setError('')
    if (!email.trim() || !password || !repeatPassword) {
      setError('Complete all fields.')
      return
    }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError('Enter a valid email address.')
      return
    }
    if (password.length < 8) {
      setError('Use a password with at least 8 characters.')
      return
    }
    if (password !== repeatPassword) {
      setError('Passwords do not match.')
      return
    }
    setIsLoading(true)
    try {
      const { error: authError } = await createClient().auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? `${window.location.origin}/auth/callback` },
      })
      if (authError) throw authError
      router.replace('/auth/sign-up-success')
    } catch (authError) {
      setError(signUpErrorMessage(authError))
    } finally {
      setIsLoading(false)
    }
  }

  return <main className="flex min-h-screen items-center justify-center bg-ivory px-5 py-10 text-ink"><section className="w-full max-w-md rounded-2xl border border-line bg-white p-6 shadow-card md:p-8"><div className="mb-8"><Link href="/" className="font-display text-2xl font-semibold">Celebrate<span className="text-rose">AI</span></Link><p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-muted">Create your workspace</p><h1 className="mt-2 font-display text-3xl font-semibold">Plan something beautiful</h1><p className="mt-2 text-sm leading-6 text-muted">Use your email to create a secure CelebrateAI account.</p></div><form onSubmit={handleSubmit} noValidate className="space-y-5"><div><label htmlFor="email" className="mb-2 block text-sm font-medium">Email</label><input id="email" name="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="min-h-11 w-full rounded-xl border border-line bg-ivory px-3 text-sm outline-none focus:ring-2 focus:ring-plum/30" /></div><div><label htmlFor="password" className="mb-2 block text-sm font-medium">Password</label><input id="password" name="password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="min-h-11 w-full rounded-xl border border-line bg-ivory px-3 text-sm outline-none focus:ring-2 focus:ring-plum/30" /></div><div><label htmlFor="repeat-password" className="mb-2 block text-sm font-medium">Confirm password</label><input id="repeat-password" name="repeat-password" type="password" autoComplete="new-password" value={repeatPassword} onChange={(event) => setRepeatPassword(event.target.value)} className="min-h-11 w-full rounded-xl border border-line bg-ivory px-3 text-sm outline-none focus:ring-2 focus:ring-plum/30" /></div>{error && <p role="alert" className="rounded-lg border border-rose/30 bg-rose/10 px-3 py-2 text-sm text-plum">{error}</p>}<button type="submit" disabled={isLoading} className="min-h-11 w-full rounded-xl bg-plum px-4 py-2.5 text-sm font-semibold text-white hover:bg-plum/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum/40 disabled:cursor-not-allowed disabled:opacity-60">{isLoading ? 'Creating account…' : 'Create account'}</button></form><p className="mt-6 text-center text-sm text-muted">Already have an account? <Link href="/auth/login" className="font-semibold text-plum underline-offset-4 hover:underline">Sign in</Link></p></section></main>
}
