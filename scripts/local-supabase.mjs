import { execFileSync } from 'node:child_process'

export function localSupabaseConfig() {
  let url = process.env.API_URL || process.env.SUPABASE_URL
  let anonKey = process.env.ANON_KEY
  if (!url || !anonKey) {
    const status = JSON.parse(execFileSync('node_modules/.bin/supabase', ['status', '-o', 'json'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 20000 }))
    url = status.API_URL
    anonKey = status.ANON_KEY
  }
  const hostname = new URL(url).hostname
  if (!['localhost', '127.0.0.1', '[::1]'].includes(hostname)) throw new Error('Seed and integration scripts only allow a local Supabase URL.')
  if (!anonKey) throw new Error('The local Supabase anonymous key is unavailable.')
  return { url, anonKey }
}
