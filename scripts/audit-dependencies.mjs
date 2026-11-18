import { spawnSync } from 'node:child_process'

const AUDIT_TIMEOUT_MS = 20_000
export const KNOWN_UNRESOLVED_ADVISORIES = new Map([
  ['https://github.com/advisories/GHSA-fc5q-39xc-vjpf', {
    package: 'picomatch',
    reason: 'No patched Picomatch release is published in the npm registry.',
  }],
  ['source:1247710', {
    package: 'picomatch',
    reason: 'No patched Picomatch release is published in the npm registry.',
  }],
])

function advisoryIdentity(advisory) {
  if (typeof advisory.url === 'string' && advisory.url) return advisory.url
  if (advisory.source !== undefined && advisory.source !== null) return `source:${advisory.source}`
  return null
}

export function parseAuditReport(output) {
  let report
  try {
    report = JSON.parse(output)
  } catch {
    throw new Error('npm audit did not return valid JSON.')
  }

  if (!report || typeof report !== 'object' || report.error || !report.metadata || !report.vulnerabilities || typeof report.vulnerabilities !== 'object') {
    throw new Error('npm audit returned an incomplete report. Check registry connectivity and try again.')
  }

  const rawCount = report.metadata.vulnerabilities?.total
  if (!Number.isInteger(rawCount) || rawCount < 0) {
    throw new Error('npm audit report is missing a valid vulnerability total.')
  }

  const advisories = new Map()
  for (const [dependency, vulnerability] of Object.entries(report.vulnerabilities)) {
    if (!vulnerability || !Array.isArray(vulnerability.via)) {
      throw new Error(`npm audit report has an invalid vulnerability entry for ${dependency}.`)
    }

    for (const advisory of vulnerability.via) {
      if (typeof advisory !== 'object' || advisory === null) continue
      const identity = advisoryIdentity(advisory)
      if (!identity) {
        throw new Error(`npm audit advisory for ${dependency} has no URL or source identifier.`)
      }

      const sourceIdentity = advisory.source === undefined || advisory.source === null ? null : `source:${advisory.source}`
      const current = advisories.get(identity) || (sourceIdentity && advisories.get(sourceIdentity)) || {
        identity,
        url: advisory.url || null,
        source: advisory.source ?? null,
        name: advisory.name || dependency,
        dependencies: [],
      }
      current.dependencies.push(dependency)
      advisories.set(identity, current)
      if (sourceIdentity) advisories.set(sourceIdentity, current)
    }
  }

  return { rawCount, advisories: [...new Set(advisories.values())] }
}

export function assessAuditReports(fullReport, runtimeReport) {
  const full = parseAuditReport(fullReport)
  const runtime = parseAuditReport(runtimeReport)
  const unexpected = full.advisories.filter(({ identity }) => !KNOWN_UNRESOLVED_ADVISORIES.has(identity))
  const errors = []

  if (runtime.rawCount > 0) {
    const identities = runtime.advisories.map(({ identity }) => identity).join(', ') || 'unidentified advisory'
    errors.push(`Runtime dependency audit reported ${runtime.rawCount} finding(s): ${identities}.`)
  }

  if (unexpected.length > 0) {
    errors.push(`Unexpected advisory identity or source: ${unexpected.map(({ identity }) => identity).join(', ')}.`)
  }

  if (full.rawCount > 0 && full.advisories.length === 0) {
    errors.push('Full dependency audit reported findings without a direct advisory record.')
  }

  return {
    full,
    runtime,
    known: full.advisories.filter(({ identity }) => KNOWN_UNRESOLVED_ADVISORIES.has(identity)),
    errors,
  }
}

export function runNpmAudit(args = []) {
  const result = spawnSync('npm', ['audit', '--json', ...args], {
    encoding: 'utf8',
    timeout: AUDIT_TIMEOUT_MS,
    maxBuffer: 5 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  if (result.error) {
    const reason = result.error.code === 'ETIMEDOUT'
      ? `timed out after ${AUDIT_TIMEOUT_MS / 1000} seconds`
      : result.error.message
    throw new Error(`npm audit ${reason}.`)
  }

  return result.stdout
}

function main() {
  try {
    const assessment = assessAuditReports(runNpmAudit(), runNpmAudit(['--omit=dev']))
    const roots = assessment.full.advisories.map(({ identity }) => identity).join(', ') || 'none'
    console.log(`Full audit raw finding count: ${assessment.full.rawCount}. Root advisories: ${roots}.`)
    console.log(`Runtime audit raw finding count: ${assessment.runtime.rawCount}.`)

    for (const advisory of assessment.known) {
      const details = KNOWN_UNRESOLVED_ADVISORIES.get(advisory.identity)
      console.warn(`WARNING: permitted unresolved ${details.package} advisory ${advisory.identity}. ${details.reason}`)
    }

    if (assessment.errors.length > 0) {
      throw new Error(assessment.errors.join(' '))
    }
  } catch (error) {
    console.error(`Dependency advisory check failed: ${error.message}`)
    process.exitCode = 1
  }
}

if (import.meta.url === new URL(process.argv[1], 'file:').href) main()
