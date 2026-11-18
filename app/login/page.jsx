'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Login from '../component/Login'
import { useAuth } from '../component/AuthProvider'
import { AccountState } from '../component/RoleGate'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const changeAccount = searchParams.get('account') === 'change'
  const { status, profile } = useAuth()
  useEffect(() => {
    if (status === 'authenticated') router.replace(`/${profile.role}/dashboard`)
  }, [status, profile, router])
  if (changeAccount && !['loading', 'authenticated'].includes(status)) return <Login />
  if (status === 'error') return <Login />
  if (['loading', 'missing-profile', 'authenticated'].includes(status)) return <AccountState />
  return <Login />
}

export default function LoginPage() {
  return <Suspense fallback={<main className="nx-account-state"><p role="status">Opening sign in…</p></main>}><LoginContent /></Suspense>
}
