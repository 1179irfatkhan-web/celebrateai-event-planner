'use client'

import { createDemoAccountSession, createDemoSession, getDemoAccount, isDemoEmailRegistered, registerDemoAccount } from '@/lib/demo-auth'
import { Eye, EyeOff, LoaderCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { FormEvent, useEffect, useState } from 'react'

const emailPattern = /^\S+@\S+\.\S+$/

type AuthMode = 'login' | 'signup'

export function DemoAuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const isSignup = mode === 'signup'
  const nextPath = searchParams.get('next') || '/'

  useEffect(() => {
    if (typeof window !== 'undefined' && window.sessionStorage.getItem('celebrateai-demo-session')) router.replace('/')
  }, [router])

  function validate() {
    if (isSignup && !name.trim()) return 'Enter your full name.'
    if (!email.trim()) return 'Enter your email address.'
    if (!emailPattern.test(email.trim())) return 'Enter a valid email address.'
    if (!password) return 'Enter a password.'
    if (isSignup && password.length < 8) return 'Use a password with at least 8 characters.'
    if (isSignup && password !== confirmPassword) return 'Passwords do not match.'
    return ''
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isLoading) return
    setError('')
    setSuccess('')
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setIsLoading(true)
    const identity = { name: isSignup ? name.trim() : getDemoAccount()?.name || 'CelebrateAI guest', email: email.trim().toLowerCase() }

    if (isSignup) {
      registerDemoAccount(identity)
      setSuccess('Demo account created. Redirecting you to login…')
      window.setTimeout(() => router.replace('/login'), 900)
      return
    }

    if (email.trim().toLowerCase() === 'demo@celebrateai.app') {
      createDemoAccountSession()
      setSuccess('Demo account ready. Opening your workspace…')
      window.setTimeout(() => router.replace(nextPath), 500)
      return
    }
    if (!isDemoEmailRegistered(email)) {
      setError('No demo account is registered with this email. Sign up first or try the demo account.')
      setIsLoading(false)
      return
    }

    createDemoSession(identity)
    setSuccess('You are signed in. Opening your workspace…')
    window.setTimeout(() => router.replace(nextPath), 500)
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-ivory px-5 py-10 text-ink">
      <section className="w-full max-w-md rounded-2xl border border-line bg-white p-6 shadow-card md:p-8">
        <div className="mb-8">
          <Link href="/" className="font-display text-2xl font-semibold">Celebrate<span className="text-rose">AI</span></Link>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-muted">{isSignup ? 'Create your workspace' : 'Welcome back'}</p>
          <h1 className="mt-2 font-display text-3xl font-semibold">{isSignup ? 'Plan something beautiful' : 'Sign in to your workspace'}</h1>
          <p className="mt-2 text-sm leading-6 text-muted">{isSignup ? 'Create a temporary demo identity for your hackathon presentation.' : 'Continue planning your celebration with your demo workspace.'}</p>
        </div>
        <div className="mb-5 rounded-xl border border-gold/40 bg-gold/10 px-3 py-2.5 text-xs font-medium text-plum">Demo mode — not for real accounts. Passwords are never stored.</div>
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {isSignup && <div><label htmlFor="full-name" className="mb-2 block text-sm font-medium">Full name</label><input id="full-name" name="full-name" type="text" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} className="min-h-11 w-full rounded-xl border border-line bg-ivory px-3 text-sm outline-none focus:ring-2 focus:ring-plum/30" /></div>}
          <div><label htmlFor="email" className="mb-2 block text-sm font-medium">Email address</label><input id="email" name="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="min-h-11 w-full rounded-xl border border-line bg-ivory px-3 text-sm outline-none focus:ring-2 focus:ring-plum/30" /></div>
          <div><label htmlFor="password" className="mb-2 block text-sm font-medium">Password</label><div className="relative"><input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete={isSignup ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)} className="min-h-11 w-full rounded-xl border border-line bg-ivory px-3 pr-11 text-sm outline-none focus:ring-2 focus:ring-plum/30" /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-1 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-muted hover:bg-soft" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button></div>{isSignup && <p className="mt-1.5 text-xs text-muted">At least 8 characters for the demo form.</p>}</div>
          {isSignup && <div><label htmlFor="confirm-password" className="mb-2 block text-sm font-medium">Confirm password</label><input id="confirm-password" name="confirm-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="min-h-11 w-full rounded-xl border border-line bg-ivory px-3 text-sm outline-none focus:ring-2 focus:ring-plum/30" /></div>}
          {error && <p role="alert" className="rounded-lg border border-rose/30 bg-rose/10 px-3 py-2 text-sm text-plum">{error}</p>}
          {success && <p role="status" className="rounded-lg border border-sage/30 bg-sage/10 px-3 py-2 text-sm text-sage">{success}</p>}
          <button type="submit" disabled={isLoading} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-plum px-4 py-2.5 text-sm font-semibold text-white hover:bg-plum/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum/40 disabled:cursor-not-allowed disabled:opacity-60">{isLoading && <LoaderCircle className="size-4 animate-spin" />}{isLoading ? (isSignup ? 'Creating account…' : 'Signing in…') : (isSignup ? 'Create Account' : 'Log In')}</button>
        </form>
        {!isSignup && <div className="mt-4"><div className="flex items-center gap-3 text-xs text-muted"><span className="h-px flex-1 bg-line" />or<span className="h-px flex-1 bg-line" /></div><button type="button" onClick={() => { createDemoAccountSession(); setSuccess('Demo account ready. Opening your workspace…'); window.setTimeout(() => router.replace('/'), 500) }} className="mt-4 min-h-11 w-full rounded-xl border border-plum/30 bg-white px-4 py-2.5 text-sm font-semibold text-plum hover:bg-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plum/40">Try Demo Account</button><p className="mt-2 text-center text-xs text-muted">Use demo@celebrateai.app with any non-empty password.</p></div>}
        <p className="mt-6 text-center text-sm text-muted">{isSignup ? <>Already have an account? <Link href="/login" className="font-semibold text-plum hover:underline">Log in</Link></> : <>Don&apos;t have an account? <Link href="/signup" className="font-semibold text-plum hover:underline">Sign up</Link></>}</p>
      </section>
    </main>
  )
}
