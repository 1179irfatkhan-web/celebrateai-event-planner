import { updateSession } from '@/lib/supabase/proxy'
import { NextRequest, NextResponse } from 'next/server'

const protectedPaths = ['/', '/events', '/timeline', '/budget', '/guests', '/vendors', '/ai-ideas']

export async function proxy(request: NextRequest) {
  const response = await updateSession(request)
  const path = request.nextUrl.pathname
  const isProtected = protectedPaths.some((protectedPath) => path === protectedPath || (protectedPath !== '/' && path.startsWith(`${protectedPath}/`)))

  if (isProtected && response.status === 200) {
    const supabase = await import('@supabase/ssr').then(({ createServerClient }) => createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => request.cookies.getAll(), setAll: () => undefined } },
    ))
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = '/auth/login'
      loginUrl.searchParams.set('next', path)
      return NextResponse.redirect(loginUrl)
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
