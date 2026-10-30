'use client'

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
      const { data } = await createClient().auth.getUser()
      if (!isActive) return
      if (!data.user) {
        router.replace(`/login?next=${encodeURIComponent(pathname)}`)
        return
      }
      setIsReady(true)
    }
    void checkSession()
    return () => {
      isActive = false
    }
  }, [pathname, router])

  if (!isReady) return <div className="min-h-screen bg-ivory" aria-label="Loading workspace" />
  return children
}
