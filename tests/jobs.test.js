import { describe, expect, test } from 'vitest'
import { newJobPayload } from '../lib/jobs'

describe('job form compatibility', () => {
  test('uses authenticated owner, normalizes optional values, and omits system fields', () => {
    const payload = newJobPayload({ title: '  Example  ', salary: '', posted_by: 'other', created_at: '', applications_count: '999' }, 'owner')
    expect(payload).toMatchObject({ title: 'Example', salary: null, posted_by: 'owner', location: null })
    expect(payload).not.toHaveProperty('created_at')
    expect(payload).not.toHaveProperty('applications_count')
  })
  test('rejects invalid numeric values, empty titles, and signed-out submissions', () => {
    expect(() => newJobPayload({ title: 'Example', salary: 'bad' }, 'owner')).toThrow()
    expect(() => newJobPayload({ title: '' }, 'owner')).toThrow()
    expect(() => newJobPayload({ title: 'Example' }, null)).toThrow()
  })
})
