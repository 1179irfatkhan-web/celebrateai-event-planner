import { updateSession } from '@/lib/supabase/proxy'
import { NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  // Keep Supabase session refresh behavior intact; the client-side DemoAuthGate owns protected-page redirects.
  return updateSession(request)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
