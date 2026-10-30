import { DemoAuthForm } from '@/components/demo-auth-form'
import { Suspense } from 'react'

export default function DemoLoginPage() {
  return <Suspense fallback={<div className="min-h-screen bg-ivory" />}><DemoAuthForm mode="login" /></Suspense>
}
