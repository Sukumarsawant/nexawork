import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'
import LoginPage from '../app/login/page'
import { AccountState } from '../app/component/RoleGate'

const state=vi.hoisted(()=>({status:'error',query:'',profile:null,refreshProfile:vi.fn()}))
const router=vi.hoisted(()=>({push:vi.fn(),replace:vi.fn()}))
const signOut=vi.hoisted(()=>vi.fn())
vi.mock('../app/component/AuthProvider',()=>({useAuth:()=>state,withTimeout:promise=>promise}))
vi.mock('../lib/supabaseClient',()=>({getSupabase:()=>({auth:{signOut}})}))
vi.mock('next/navigation',()=>({useRouter:()=>router,useSearchParams:()=>new URLSearchParams(state.query)}))
vi.mock('../app/component/Login',()=>({default:()=> <p>Available sign-in form</p>}))
beforeEach(()=>{state.status='error';state.query='';signOut.mockResolvedValue({error:null});window.history.replaceState({},'', '/login')})

test('auth profile failures do not trap the login route behind the same error state',()=>{
  render(<LoginPage />)
  expect(screen.getByText('Available sign-in form')).toBeInTheDocument()
})

test('missing-profile recovery offers a local sign-out and another-account route',async()=>{
  state.status='missing-profile'
  render(<AccountState />)
  await userEvent.setup().click(screen.getByRole('button',{name:'Use another account'}))
  expect(signOut).toHaveBeenCalledWith({scope:'local'})
  expect(router.push).toHaveBeenCalledWith('/login?account=change')
})

test('changing accounts still exposes sign-in if logout cannot reach the server',async()=>{
  signOut.mockRejectedValue(new Error('offline'))
  render(<AccountState />)
  await userEvent.setup().click(screen.getByRole('button',{name:'Use another account'}))
  expect(router.push).toHaveBeenCalledWith('/login?account=change')
})


test('same-route query changes reach sign-in when missing-profile logout fails',async()=>{
  state.status='missing-profile'
  signOut.mockRejectedValue(new Error('offline'))
  const {rerender}=render(<LoginPage />)
  expect(screen.getByRole('heading',{name:'Complete your profile'})).toBeInTheDocument()
  await userEvent.setup().click(screen.getByRole('button',{name:'Use another account'}))
  state.query='account=change'
  rerender(<LoginPage />)
  expect(screen.getByText('Available sign-in form')).toBeInTheDocument()
})
