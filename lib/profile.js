export const EDITABLE_PROFILE_FIELDS = [
  'name', 'username', 'bio', 'profile_image_url', 'tagline', 'about', 'location', 'timezone',
  'languages', 'skills', 'availability_hours_per_week', 'availability_status', 'hourly_rate',
  'preferred_pricing', 'portfolio_links', 'resume_url', 'education', 'certifications', 'achievements',
]

export function editableProfile(profile) {
  return Object.fromEntries(EDITABLE_PROFILE_FIELDS.filter(field => profile[field] !== undefined).map(field => [field, profile[field]]))
}

export function safeWebUrl(value) {
  try {
    const url = new URL(value)
    return ['https:', 'http:'].includes(url.protocol) ? url.href : null
  } catch { return null }
}
