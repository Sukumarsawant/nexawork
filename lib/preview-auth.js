// An opt-in development adapter for hosts that remove the Authorization header.
// The server still validates the complete bearer token; this is not authentication.
export function sessionHeaders(token) {
  const headers = { Authorization: `Bearer ${token}` }
  if (process.env.NEXT_PUBLIC_PREVIEW_AUTH_PROXY === 'true') headers['X-Nexawork-Authorization'] = `Bearer ${token}`
  return headers
}

export function previewAuthFetch(input, init = {}) {
  const headers = new Headers(init.headers || (input instanceof Request ? input.headers : undefined))
  if (process.env.NEXT_PUBLIC_PREVIEW_AUTH_PROXY === 'true' && headers.has('authorization')) {
    headers.set('X-Nexawork-Authorization', headers.get('authorization'))
    headers.delete('authorization')
  }
  return fetch(input, { ...init, headers })
}
