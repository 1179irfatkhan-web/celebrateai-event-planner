'use client'

import { DEMO_AUTH_EVENT, getDemoSession } from '@/lib/demo-auth'
import { createClient } from '@/lib/supabase/client'
import { usePathname, useRouter } from 'next/navigation'
import { ReactNode, useEffect, useState } from 'react'

export function DemoAuthGate({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    let isActive = true
    const checkSession = async () => {
      if (getDemoSession()) {
        if (isActive) setIsReady(true)
        return
      }
      const { data } = await createClient().auth.getUser()
      if (!isActive) return
      if (!data.user) {
        router.replace(`/login?next=${encodeURIComponent(pathname)}`)
        return
      }
      setIsReady(true)
    }
    const handleAuthChange = () => void checkSession()
    void checkSession()
    window.addEventListener(DEMO_AUTH_EVENT, handleAuthChange)
    return () => {
      isActive = false
      window.removeEventListener(DEMO_AUTH_EVENT, handleAuthChange)
    }
  }, [pathname, router])

  if (!isReady) return <div className="min-h-screen bg-ivory" aria-label="Loading workspace" />
  return children
}
