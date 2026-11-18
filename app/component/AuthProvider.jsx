'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { getSupabase } from '@/lib/supabaseClient'

const AuthContext = createContext(null)
const initial = { user: null, profile: null, status: 'loading', error: null }

export function withTimeout(promise, milliseconds = 12000) {
  let timer
  return Promise.race([
    promise,
    new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('The connection timed out. Please retry.')), milliseconds) }),
  ]).finally(() => clearTimeout(timer))
}

export default function AuthProvider({ children }) {
  const [auth, setAuth] = useState(initial)
  const [revision, setRevision] = useState(0)
  const generation = useRef(0)
  const client = getSupabase()

  const refreshProfile = useCallback(() => setRevision(value => value + 1), [])

  useEffect(() => {
    if (!client) {
      setAuth({ ...initial, status: 'unconfigured' })
      return
    }
    let alive = true
    let currentIdentity
    const resolveSession = async session => {
      const identity = session?.user?.id ?? null
      // TOKEN_REFRESHED for the same user must not unmount their unsaved forms.
      if (currentIdentity === identity) return
      currentIdentity = identity
      const request = ++generation.current
      if (!session?.user) {
        setAuth({ ...initial, status: 'signed-out' })
        return
      }
      setAuth({ ...initial, user: session.user })
      try {
        const { data, error } = await withTimeout(client.from('profiles').select('*').eq('id', session.user.id).maybeSingle())
        if (error) throw error
        if (!alive || request !== generation.current) return
        if (data && !['student', 'business'].includes(data.role)) throw new Error('This account has an unsupported role. Contact the project administrator.')
        setAuth({ user: session.user, profile: data, status: data ? 'authenticated' : 'missing-profile', error: null })
      } catch {
        if (alive && request === generation.current) {
          currentIdentity = undefined
          setAuth({ user: session.user, profile: null, status: 'error', error: 'We could not load your account. Check the connection and retry.' })
        }
      }
    }
    // Do not call Supabase methods inside its synchronous auth-event lock.
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      setTimeout(() => { if (alive) void resolveSession(session) }, 0)
    })
    const startGeneration = generation.current
    withTimeout(client.auth.getSession()).then(({ data, error }) => {
      if (!alive || generation.current !== startGeneration) return
      if (error) throw error
      void resolveSession(data.session)
    }).catch(() => {
      if (alive && generation.current === startGeneration) setAuth({ ...initial, status: 'error', error: 'We could not restore your session. Please retry.' })
    })
    return () => { alive = false; generation.current += 1; subscription.unsubscribe() }
  }, [client, revision])

  return <AuthContext.Provider value={{ ...auth, refreshProfile }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be inside AuthProvider')
  return value
}
