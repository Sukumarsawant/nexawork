'use client'

import { useState } from 'react'
import { getSupabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { withTimeout } from './AuthProvider'

export default function LogoutButton() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function logout() {
    setBusy(true); setError('')
    try {
      const { error } = await withTimeout(getSupabase().auth.signOut())
      if (error) throw error
      router.replace('/login')
    } catch { setError('We could not sign you out. Please retry.') }
    finally { setBusy(false) }
  }
  return <div><button onClick={logout} disabled={busy} className="nx-button-secondary">{busy ? 'Signing out…' : 'Sign out'}</button>{error && <p role="alert">{error}</p>}</div>
}
