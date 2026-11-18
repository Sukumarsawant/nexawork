const fields = ['title', 'location', 'company_name', 'company_url', 'description', 'employment_type', 'seniority_level', 'job_function', 'industries_sector', 'job_url', 'poster_profile_url', 'company_id', 'apply_url', 'apply_type', 'sbenefits']

export function newJobPayload(form, userId) {
  if (!userId) throw new Error('Sign in with a business account to post a job.')
  const title = String(form.title || '').trim()
  if (!title || title.length > 200) throw new Error('Enter a job title with 1–200 characters.')
  const payload = Object.fromEntries(fields.map(field => [field, String(form[field] || '').trim() || null]))
  payload.title = title
  payload.posted_by = userId
  const salary = form.salary === '' || form.salary == null ? null : Number(form.salary)
  if (salary !== null && (!Number.isFinite(salary) || salary < 0 || salary > 9999999999.99)) throw new Error('Enter a valid non-negative salary amount.')
  payload.salary = salary
  // Database defaults own identifiers, timestamps, status, and application counts.
  return payload
}

export const SALARY_RANGES = ['0–50k', '50k–100k', '100k–150k', '150k+']
export function matchesSalaryRange(salary, range) {
  if (!range) return true
  if (salary === null || salary === undefined || salary === '') return false
  const amount = Number(salary)
  if (!Number.isFinite(amount) || amount < 0) return false
  const bounds = { '0–50k': [0, 50000], '50k–100k': [50000, 100000], '100k–150k': [100000, 150000], '150k+': [150000, Infinity] }[range]
  return Boolean(bounds && amount >= bounds[0] && amount < bounds[1])
}
