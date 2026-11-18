// @vitest-environment node
import { afterEach, expect, test, vi } from 'vitest'
import { proxyPreviewRequest } from '../lib/server/preview-proxy'
import { getBearerToken } from '../lib/server/api'
import { previewAuthFetch, sessionHeaders } from '../lib/preview-auth'

afterEach(()=>{vi.unstubAllEnvs();vi.unstubAllGlobals()})
function enable(){vi.stubEnv('NEXT_PUBLIC_PREVIEW_AUTH_PROXY','true');vi.stubEnv('SUPABASE_PREVIEW_TARGET','http://127.0.0.1:54321');vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY','synthetic-anon')}

test('preview proxy is disabled by default',async()=>{
  vi.stubEnv('NEXT_PUBLIC_PREVIEW_AUTH_PROXY','')
  expect((await proxyPreviewRequest(new Request('https://preview.test/api/supabase/auth/v1/user'),['auth','v1','user'])).status).toBe(404)
})
test('preview proxy rejects remote targets and invalid API paths',async()=>{
  enable();vi.stubEnv('SUPABASE_PREVIEW_TARGET','https://example.test')
  expect((await proxyPreviewRequest(new Request('https://preview.test'),['auth','v1','user'])).status).toBe(503)
  enable()
  expect((await proxyPreviewRequest(new Request('https://preview.test'),['..','v1','user'])).status).toBe(404)
})
test('preview proxy restores the token only on the fixed local upstream',async()=>{
  enable()
  const upstream=vi.fn().mockResolvedValue(new Response('{"id":"synthetic"}',{headers:{'content-type':'application/json'}}))
  vi.stubGlobal('fetch',upstream)
  const result=await proxyPreviewRequest(new Request('https://preview.test/api/supabase/auth/v1/user',{headers:{'x-nexawork-authorization':'Bearer synthetic-token'}}),['auth','v1','user'])
  expect(await result.json()).toEqual({id:'synthetic'})
  const [url,options]=upstream.mock.calls[0]
  expect(url.href).toBe('http://127.0.0.1:54321/auth/v1/user')
  expect(options.headers.get('authorization')).toBe('Bearer synthetic-token')
  expect(options.headers.get('apikey')).toBe('synthetic-anon')
  expect(result.headers.get('cache-control')).toBe('no-store')
})
test('preview request bodies have a fixed size bound',async()=>{
  enable()
  const result=await proxyPreviewRequest(new Request('https://preview.test',{method:'POST',headers:{'content-length':'8000000'},body:'{}'}),['auth','v1','token'])
  expect(result.status).toBe(413)
})
test('the browser adapter preserves production headers and forwards only when opted in',async()=>{
  const upstream=vi.fn().mockResolvedValue(new Response('{}'))
  vi.stubGlobal('fetch',upstream)
  vi.stubEnv('NEXT_PUBLIC_PREVIEW_AUTH_PROXY','')
  await previewAuthFetch('https://example.test',{headers:{authorization:'Bearer synthetic'}})
  expect(upstream.mock.calls[0][1].headers.get('authorization')).toBe('Bearer synthetic')
  enable()
  await previewAuthFetch('https://preview.test',{headers:{authorization:'Bearer synthetic'}})
  expect(upstream.mock.calls[1][1].headers.has('authorization')).toBe(false)
  expect(upstream.mock.calls[1][1].headers.get('x-nexawork-authorization')).toBe('Bearer synthetic')
})
test('alternate API token headers remain opt-in and require normal bearer validation',()=>{
  const request=new Request('https://preview.test',{headers:{'x-nexawork-authorization':'Bearer synthetic'}})
  vi.stubEnv('NEXT_PUBLIC_PREVIEW_AUTH_PROXY','')
  expect(getBearerToken(request)).toBeNull()
  enable()
  expect(getBearerToken(request)).toBe('synthetic')
  expect(sessionHeaders('synthetic')['X-Nexawork-Authorization']).toBe('Bearer synthetic')
})
