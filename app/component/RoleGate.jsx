'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth, withTimeout } from './AuthProvider'
import { getSupabase } from '@/lib/supabaseClient'

export function AccountState() {
  const { status, error, refreshProfile, profile } = useAuth()
  const [role, setRole] = useState('student')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState('')
  const router = useRouter()
  async function changeAccount() {
    setBusy(true); setFailure('')
    try {
      const result = await withTimeout(getSupabase().auth.signOut({ scope: 'local' }), 5000)
      if (result.error) throw result.error
    } catch {
      // Reauthentication can replace the old session even when remote logout fails.
    } finally {
      setBusy(false)
      router.push('/login?account=change')
    }
  }
  async function completeProfile(event) {
    event.preventDefault()
    setBusy(true)
    setFailure('')
    try {
      const { error } = await withTimeout(getSupabase().rpc('bootstrap_profile', { chosen_role: role, display_name: name.trim() }))
      if (error) throw error
      refreshProfile()
    } catch { setFailure('We could not create your profile. Please retry or contact the project administrator.') }
    finally { setBusy(false) }
  }
  return <main className="nx-account-state">
    <section className="nx-account-card" aria-labelledby="account-title" aria-busy={busy || status === 'loading'}>
      <h1 id="account-title">{status === 'loading' ? 'Opening your workspace' : status === 'unconfigured' ? 'Setup is required' : status === 'missing-profile' ? 'Complete your profile' : status === 'authenticated' ? 'Open your workspace' : 'Your workspace is unavailable'}</h1>
      {status === 'loading' ? <p role="status">Please wait while we check your account.</p> : status === 'unconfigured' ? <p>Set the public Supabase URL and anonymous key using the README instructions, then restart Nexawork.</p> : status === 'missing-profile' ? <form onSubmit={completeProfile}>
        <p>Your account has no profile yet. This choice does not change an existing account role.</p>
        <label htmlFor="onboard-name">Display name</label><input id="onboard-name" className="nx-field" value={name} onChange={e => setName(e.target.value)} required maxLength={100} />
        <label htmlFor="onboard-role">Account type</label><select id="onboard-role" className="nx-field" value={role} onChange={e => setRole(e.target.value)}><option value="student">Student</option><option value="business">Business</option></select>
        {failure && <p role="alert" className="nx-feedback-error">{failure}</p>}
        <button className="nx-button-primary" disabled={busy || !name.trim()}>{busy ? 'Creating profile…' : 'Create profile'}</button>
      </form> : status === 'authenticated' ? <><p>This page belongs to a different account type.</p><Link className="nx-button-primary" href={`/${profile.role}/dashboard`}>Open my workspace</Link></> : <><p role="alert">{error || 'Sign in to open your workspace.'}</p><button className="nx-button-primary" onClick={refreshProfile}>Retry</button><Link className="nx-text-link" href="/login">Go to sign in</Link></>}
      {['missing-profile', 'error'].includes(status) && <button className="nx-text-link" disabled={busy} onClick={changeAccount}>{busy ? 'Please wait…' : 'Use another account'}</button>}
    </section>
  </main>
}

export default function RoleGate({ role, children }) {
  const { status, profile, user } = useAuth()
  const router = useRouter()
  useEffect(() => {
    if (status === 'signed-out') router.replace('/login?reason=session')
  }, [status, router])
  if (status !== 'authenticated' || (role && profile?.role !== role)) return <AccountState />
  // Changing users unmounts all account-specific drafts and loaded rows.
  return <div key={user.id}>{children}</div>
}
