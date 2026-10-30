export const DEMO_ACCOUNT_KEY = 'celebrateai-demo-account'
export const DEMO_SESSION_KEY = 'celebrateai-demo-session'
export const DEMO_AUTH_EVENT = 'celebrateai-demo-auth-change'
export const DEMO_EMAIL = 'demo@celebrateai.com'
export const DEMO_PASSWORD = 'Demo@123'

export type DemoIdentity = {
  name: string
  email: string
}

const DEMO_IDENTITY: DemoIdentity = {
  name: 'Aarav & Kavya',
  email: DEMO_EMAIL,
}

function read<T>(key: string): T | null {
  if (typeof window === 'undefined') return null
  try {
    const value = window.sessionStorage.getItem(key)
    return value ? (JSON.parse(value) as T) : null
  } catch {
    return null
  }
}

function write(key: string, value: unknown) {
  window.sessionStorage.setItem(key, JSON.stringify(value))
}

export function getDemoAccount(): DemoIdentity | null {
  return read<DemoIdentity>(DEMO_ACCOUNT_KEY)
}

export function getDemoSession(): DemoIdentity | null {
  return read<DemoIdentity>(DEMO_SESSION_KEY)
}

export function registerDemoAccount(identity: DemoIdentity) {
  write(DEMO_ACCOUNT_KEY, identity)
  window.dispatchEvent(new Event(DEMO_AUTH_EVENT))
}

export function createDemoSession(identity: DemoIdentity) {
  write(DEMO_SESSION_KEY, identity)
  window.dispatchEvent(new Event(DEMO_AUTH_EVENT))
}

export function createDemoAccountSession() {
  registerDemoAccount(DEMO_IDENTITY)
  createDemoSession(DEMO_IDENTITY)
}

export function clearDemoSession() {
  window.sessionStorage.removeItem(DEMO_SESSION_KEY)
  window.dispatchEvent(new Event(DEMO_AUTH_EVENT))
}

export function isDemoEmailRegistered(email: string) {
  const account = getDemoAccount()
  return Boolean(account && account.email.toLowerCase() === email.trim().toLowerCase())
}
