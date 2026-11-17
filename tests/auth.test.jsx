import React from 'react'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, beforeEach, test, expect } from 'vitest'
import AuthProvider, { useAuth } from '../app/component/AuthProvider'
import Login from '../app/component/Login'
import { editableProfile, safeWebUrl } from '../lib/profile'

const { client, state } = vi.hoisted(() => ({ client: { auth: {}, from: vi.fn() }, state: { configured: true } }))
vi.mock('../lib/supabaseClient', () => ({ getSupabase: () => state.configured ? client : null }))
vi.mock('next/image', () => ({ default: ({ priority: _priority, ...props }) => <img {...props} alt={props.alt} /> }))

let listener
let unsubscribe
beforeEach(() => {
  state.configured = true
  unsubscribe = vi.fn()
  client.auth.onAuthStateChange = vi.fn(fn => { listener = fn; return { data: { subscription: { unsubscribe } } } })
  client.auth.getSession = vi.fn().mockResolvedValue({ data: { session: null } })
  client.auth.signUp = vi.fn().mockResolvedValue({ data: { user: { id: 'new' }, session: null }, error: null })
  client.auth.signInWithPassword = vi.fn().mockResolvedValue({ error: null })
  client.from = vi.fn(() => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { id: 'a', name: 'Student', role: 'student' }, error: null }) }) }) }))
})
function Probe() {
  const auth = useAuth()
  return <><p>{auth.status}</p><span>{auth.profile?.name}</span></>
}

test('configuration absence is explicit and does not throw on import', async () => {
  state.configured = false
  render(<AuthProvider><Probe /></AuthProvider>)
  expect(await screen.findByText('unconfigured')).toBeInTheDocument()
})

test('restores a session, clears private state on sign-out, and cleans subscription', async () => {
  client.auth.getSession.mockResolvedValue({ data: { session: { user: { id: 'a' } } } })
  const { unmount } = render(<AuthProvider><Probe /></AuthProvider>)
  expect(await screen.findByText('Student')).toBeInTheDocument()
  act(() => listener('SIGNED_OUT', null))
  expect(await screen.findByText('signed-out')).toBeInTheDocument()
  expect(screen.queryByText('Student')).not.toBeInTheDocument()
  unmount()
  expect(unsubscribe).toHaveBeenCalled()
})

test('token refresh for the same user does not flash loading or discard workspace', async () => {
  client.auth.getSession.mockResolvedValue({ data: { session: { user: { id: 'a' } } } })
  render(<AuthProvider><Probe /></AuthProvider>)
  await screen.findByText('authenticated')
  act(() => listener('TOKEN_REFRESHED', { user: { id: 'a' } }))
  await waitFor(() => expect(client.from).toHaveBeenCalledTimes(1))
  expect(screen.getByText('Student')).toBeInTheDocument()
})

test('signup supplies validated role/name metadata and does not insert a profile before confirmation', async () => {
  const user = userEvent.setup()
  render(<Login />)
  await user.click(screen.getByRole('button', { name: 'Create an account' }))
  await user.type(screen.getByLabelText('Display name'), 'Synthetic Business')
  await user.type(screen.getByLabelText('Email address'), 'synthetic@example.test')
  await user.type(screen.getByLabelText('Password'), 'Synthetic123!')
  await user.selectOptions(screen.getByLabelText('Account type'), 'business')
  await user.click(screen.getByRole('button', { name: 'Create account', exact: true }))
  await screen.findByText(/Check your email to confirm/)
  expect(client.auth.signUp).toHaveBeenCalledWith(expect.objectContaining({ options: { data: { name: 'Synthetic Business', role: 'business' } } }))
  expect(client.from).not.toHaveBeenCalled()
})

test('profile updates never send protected fields or draft helpers', () => {
  expect(editableProfile({ name: 'A', role: 'business', badges: ['x'], avg_rating: 5, id: 'other', skillsText: 'js' })).toEqual({ name: 'A' })
})

test('profile links reject scripts and relative URLs', () => {
  expect(safeWebUrl('javascript:alert(1)')).toBeNull()
  expect(safeWebUrl('/private')).toBeNull()
  expect(safeWebUrl('https://example.com')).toBe('https://example.com/')
})
