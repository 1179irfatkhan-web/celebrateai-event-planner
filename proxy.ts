import { updateSession } from '@/lib/supabase/proxy'
import { NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  // Demo auth uses sessionStorage, so the client-side DemoAuthGate owns redirects.
  // Keep Supabase session refresh behavior intact for the existing auth integration.
  return updateSession(request)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
