import { describe, expect, it } from 'vitest'
import { assessAuditReports, parseAuditReport } from '../scripts/audit-dependencies.mjs'

const picomatch = {
  source: 1247710,
  name: 'picomatch',
  url: 'https://github.com/advisories/GHSA-fc5q-39xc-vjpf',
}

function report({ total = 0, vulnerabilities = {} } = {}) {
  return JSON.stringify({
    metadata: { vulnerabilities: { total } },
    vulnerabilities,
  })
}

describe('dependency advisory audit', () => {
  it('accepts an audit with no advisories', () => {
    const assessment = assessAuditReports(report(), report())

    expect(assessment.errors).toEqual([])
    expect(assessment.full.rawCount).toBe(0)
  })

  it('warns but accepts only the documented Picomatch advisory in development tooling', () => {
    const full = report({
      total: 4,
      vulnerabilities: {
        vite: { via: ['picomatch'] },
        picomatch: { via: [picomatch] },
      },
    })
    const assessment = assessAuditReports(full, report())

    expect(assessment.errors).toEqual([])
    expect(assessment.known).toHaveLength(1)
    expect(assessment.full.advisories[0].dependencies).toEqual(['picomatch'])
  })

  it('deduplicates advisory records by their shared npm source', () => {
    const full = report({
      total: 2,
      vulnerabilities: {
        first: { via: [picomatch] },
        second: { via: [{ source: 1247710, name: 'picomatch' }] },
      },
    })
    const assessment = assessAuditReports(full, report())

    expect(assessment.errors).toEqual([])
    expect(assessment.full.advisories).toHaveLength(1)
    expect(assessment.full.advisories[0].dependencies).toEqual(['first', 'second'])
  })

  it('rejects an unknown advisory identity', () => {
    const unknown = { source: 42, name: 'example', url: 'https://github.com/advisories/GHSA-example' }
    const assessment = assessAuditReports(report({ total: 1, vulnerabilities: { example: { via: [unknown] } } }), report())

    expect(assessment.errors).toContain('Unexpected advisory identity or source: https://github.com/advisories/GHSA-example.')
  })

  it('rejects even the permitted advisory when it appears in runtime dependencies', () => {
    const known = report({ total: 1, vulnerabilities: { picomatch: { via: [picomatch] } } })
    const assessment = assessAuditReports(known, known)

    expect(assessment.errors[0]).toContain('Runtime dependency audit reported 1 finding(s)')
  })

  it('rejects malformed and network-error audit output', () => {
    expect(() => parseAuditReport('{')).toThrow('npm audit did not return valid JSON.')
    expect(() => parseAuditReport(JSON.stringify({ error: { code: 'ENETUNREACH' } }))).toThrow('incomplete report')
  })
})
