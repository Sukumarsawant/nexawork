import { createClient } from '@supabase/supabase-js'
import { previewAuthFetch } from './preview-auth'

let client

export function getSupabase() {
  const url = process.env.NEXT_PUBLIC_PREVIEW_AUTH_PROXY === 'true' && typeof window !== 'undefined'
    ? `${window.location.origin}/api/supabase`
    : process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  if (!client) client = createClient(url, key, { global: { fetch: previewAuthFetch } })
  return client
}

// Keep existing feature imports compatible without creating a client at import time.
export const supabase = new Proxy({}, {
  get(_target, property) {
    const instance = getSupabase()
    if (!instance) throw new Error('Nexawork database is not configured. Follow the README setup instructions.')
    const value = instance[property]
    return typeof value === 'function' ? value.bind(instance) : value
  },
})
