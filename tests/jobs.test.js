import { describe, expect, test } from 'vitest'
import { matchesSalaryRange, newJobPayload } from '../lib/jobs'

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


test('new numeric salaries filter by bounds without string operations', () => {
  const job = newJobPayload({title:'Synthetic opening',salary:'80000'},'owner')
  expect(matchesSalaryRange(job.salary,'50k–100k')).toBe(true)
  expect(matchesSalaryRange(job.salary,'0–50k')).toBe(false)
  expect(matchesSalaryRange(0,'0–50k')).toBe(true)
  expect(matchesSalaryRange(50000,'50k–100k')).toBe(true)
  expect(matchesSalaryRange(150000,'150k+')).toBe(true)
  expect(matchesSalaryRange(null,'0–50k')).toBe(false)
  expect(matchesSalaryRange('not numeric','150k+')).toBe(false)
})
