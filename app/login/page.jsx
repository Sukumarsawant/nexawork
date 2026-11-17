'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Login from '../component/Login'
import { useAuth } from '../component/AuthProvider'
import { AccountState } from '../component/RoleGate'

export default function LoginPage() {
  const router = useRouter()
  const { status, profile } = useAuth()
  useEffect(() => {
    if (status === 'authenticated') router.replace(`/${profile.role}/dashboard`)
  }, [status, profile, router])
  if (['loading', 'missing-profile', 'error', 'authenticated'].includes(status)) return <AccountState />
  return <Login />
}
