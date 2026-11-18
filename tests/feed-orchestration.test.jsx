import React from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, expect, test, vi } from 'vitest'
import ProfessionalFeed from '../app/component/feed/ProfessionalFeed'

const data=vi.hoisted(()=>({
  client:{}, auth:{user:{id:'owner'},profile:{id:'owner',name:'Synthetic Student'},status:'authenticated'},
  fetchFeedPage:vi.fn(),fetchPostById:vi.fn(),createPost:vi.fn(),
}))
vi.mock('../lib/supabaseClient',()=>({getSupabase:()=>data.client}))
vi.mock('../app/component/AuthProvider',()=>({useAuth:()=>data.auth}))
vi.mock('../lib/feed',async original=>({...await original(),fetchFeedPage:data.fetchFeedPage,fetchPostById:data.fetchPostById,createPost:data.createPost}))
vi.mock('../app/component/feed/PostComposer',()=>({default:({onSubmit,isSubmitting})=><div>
  <span>{isSubmitting?'Request active':'Ready'}</span>
  <button onClick={()=>onSubmit({content:'original',image:null})}>Original submit</button>
  <button onClick={()=>onSubmit({content:'edited',image:null})}>Edited submit</button>
</div>}))
beforeEach(()=>{
  data.fetchFeedPage.mockResolvedValue({items:[],next_cursor:null})
  data.createPost.mockReset()
  data.fetchPostById.mockReset()
})

test('a deferred edited-draft reconciliation acquires its guard before a second click',async()=>{
  data.createPost.mockRejectedValueOnce(new Error('Response lost')).mockImplementation(async(_client,payload)=>({id:payload.id,content:payload.content,created_at:new Date().toISOString()}))
  let resolveRead
  data.fetchPostById.mockImplementation(()=>new Promise(resolve=>{resolveRead=resolve}))
  render(<ProfessionalFeed />)
  await screen.findByText('Start the conversation')
  fireEvent.click(screen.getByRole('button',{name:'Original submit'}))
  await waitFor(()=>expect(screen.getByText('Ready')).toBeInTheDocument())
  fireEvent.click(screen.getByRole('button',{name:'Edited submit'}))
  fireEvent.click(screen.getByRole('button',{name:'Edited submit'}))
  expect(data.fetchPostById).toHaveBeenCalledTimes(1)
  expect(screen.getByText('Request active')).toBeInTheDocument()
  await act(async()=>resolveRead(null))
  await waitFor(()=>expect(data.createPost).toHaveBeenCalledTimes(2))
  expect(screen.getByText('Ready')).toBeInTheDocument()
})
