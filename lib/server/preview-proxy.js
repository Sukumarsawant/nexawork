import { createTimeoutFetch, readBoundedBody } from './api'

const MAX_BYTES = 6 * 1024 * 1024
const PATHS = new Set(['auth', 'rest', 'storage'])

export async function proxyPreviewRequest(request, segments) {
  if (process.env.NEXT_PUBLIC_PREVIEW_AUTH_PROXY !== 'true' || !process.env.SUPABASE_PREVIEW_TARGET) return new Response('Not found', { status: 404 })
  let target
  try {
    target = new URL(process.env.SUPABASE_PREVIEW_TARGET)
    if (!['127.0.0.1', 'localhost', '[::1]'].includes(target.hostname) || target.protocol !== 'http:' || target.port !== '54321' || target.pathname !== '/' || target.search || target.hash || target.username || target.password) throw new Error('Invalid target')
  } catch { return new Response('Preview backend is unavailable', { status: 503 }) }
  if (!Array.isArray(segments) || !PATHS.has(segments[0]) || segments[1] !== 'v1' || segments.some(part => !part || part === '.' || part === '..' || part.includes('/') || part.includes('\\')) || segments.join('/').length > 2048) return new Response('Not found', { status: 404 })
  target.pathname = '/' + segments.map(encodeURIComponent).join('/')
  target.search = new URL(request.url).search
  const headers = new Headers({ apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '' })
  for (const key of ['content-type', 'prefer', 'range', 'range-unit', 'accept', 'x-upsert', 'x-client-info']) {
    const value = request.headers.get(key)
    if (value) headers.set(key, value)
  }
  const authorization = request.headers.get('x-nexawork-authorization') || request.headers.get('authorization')
  if (authorization) headers.set('authorization', authorization)
  try {
    const body = ['GET', 'HEAD'].includes(request.method) ? undefined : await readBoundedBody(request, MAX_BYTES)
    const upstream = await createTimeoutFetch(15000)(target, { method: request.method, headers, body, redirect: 'manual' })
    const outputHeaders = new Headers({ 'cache-control': 'no-store' })
    for (const name of ['content-type', 'content-range', 'range-unit', 'retry-after']) {
      const value = upstream.headers.get(name)
      if (value) outputHeaders.set(name, value)
    }
    if (request.method === 'HEAD' || [204, 205, 304].includes(upstream.status)) return new Response(null, { status: upstream.status, headers: outputHeaders })
    const bytes = await readBoundedBody(upstream, MAX_BYTES)
    return new Response(bytes, { status: upstream.status, headers: outputHeaders })
  } catch (error) {
    return new Response(error.message === 'REQUEST_TOO_LARGE' ? 'Preview request is too large' : 'Preview backend request failed', { status: error.message === 'REQUEST_TOO_LARGE' ? 413 : 502 })
  }
}
