import { expect, test, vi } from 'vitest'
import { persistProfileImage, PROFILE_IMAGE_TIMEOUT_MS } from '../lib/profile-image'

function imageClient({ write, read, conflict = false }) {
  const bucket = {
    upload: vi.fn().mockResolvedValue({error:conflict ? {statusCode:'409'} : null}),
    list: vi.fn().mockResolvedValue({data:[{name:'same.png',metadata:{size:3,mimetype:'image/png'}}],error:null}),
    getPublicUrl: () => ({data:{publicUrl:'https://example.test/owner/same.png'}}),
    remove: vi.fn(),
  }
  const client = {storage:{from:()=>bucket},from:()=>({
    update:()=>({eq:()=>({abortSignal:write})}),
    select:()=>({eq:()=>({maybeSingle:()=>({abortSignal:read})})}),
  })}
  return {client,bucket}
}
const candidate = {path:'owner/same.png',file:{size:3,type:'image/png'}}

test('lost profile-save responses reconcile without deleting a published avatar', async () => {
  vi.useFakeTimers()
  try {
    const {client,bucket}=imageClient({write:()=>new Promise(()=>{}),read:async()=>({data:{profile_image_url:'https://example.test/owner/same.png'},error:null})})
    const pending=persistProfileImage(client,'owner',candidate)
    await vi.advanceTimersByTimeAsync(PROFILE_IMAGE_TIMEOUT_MS)
    expect(await pending).toBe('https://example.test/owner/same.png')
    expect(bucket.remove).not.toHaveBeenCalled()
  } finally {vi.useRealTimers()}
})

test('uncertain saves fail within a bound and remain retryable at the same owned path', async () => {
  vi.useFakeTimers()
  try {
    const {client,bucket}=imageClient({write:()=>new Promise(()=>{}),read:async()=>({data:{profile_image_url:'old'},error:null}),conflict:true})
    const pending=persistProfileImage(client,'owner',candidate)
    const rejection=expect(pending).rejects.toThrow('Retry image save')
    await vi.advanceTimersByTimeAsync(PROFILE_IMAGE_TIMEOUT_MS)
    await rejection
    expect(bucket.list).toHaveBeenCalledWith('owner',{limit:100,search:'same.png'})
    expect(bucket.remove).not.toHaveBeenCalled()
  } finally {vi.useRealTimers()}
})
