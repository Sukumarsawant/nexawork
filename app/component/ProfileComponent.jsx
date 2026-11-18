'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabase } from '@/lib/supabaseClient'
import { editableProfile } from '@/lib/profile'
import { persistProfileImage } from '@/lib/profile-image'
import { useAuth, withTimeout } from './AuthProvider'

const textFields = [['name', 'Name', true], ['username', 'Username'], ['tagline', 'Tagline'], ['location', 'Location'], ['timezone', 'Timezone']]

export default function ProfileForm({ userId, onSaved }) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [pendingImage, setPendingImage] = useState(null)
  const [revision, setRevision] = useState(0)
  const { refreshProfile } = useAuth()
  const router = useRouter()
  useEffect(() => {
    let alive = true
    setLoading(true)
    async function load() {
      try {
        const client = getSupabase()
        if (!client) throw new Error('Setup is required.')
        const { data, error } = await withTimeout(client.from('profiles').select('*').eq('id', userId).single())
        if (error || !data) throw new Error('We could not load your profile.')
        if (alive) { setProfile(data); setError('') }
      } catch { if (alive) setError('We could not load your profile. Please retry.') }
      finally { if (alive) setLoading(false) }
    }
    if (userId) void load()
    return () => { alive = false }
  }, [userId, revision])
  function change(event) {
    const { name, value, type } = event.target
    setProfile(previous => ({ ...previous, [name]: type === 'number' ? (value === '' ? null : Number(value)) : value }))
  }
  async function upload(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const extensions = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif', 'image/webp': 'webp' }
    if (!extensions[file.type] || file.size > 5 * 1024 * 1024 || file.size === 0) { setError('Choose a JPEG, PNG, GIF, or WebP image up to 5 MiB.'); return }
    const candidate = { file, path: `${userId}/${crypto.randomUUID()}.${extensions[file.type]}` }
    setPendingImage(candidate)
    await saveImage(candidate)
  }
  async function saveImage(candidate) {
    setBusy(true); setError(''); setMessage('')
    try {
      const publicUrl = await persistProfileImage(getSupabase(), userId, candidate)
      setProfile(previous => ({ ...previous, profile_image_url: publicUrl }))
      setPendingImage(null)
      setMessage('Profile image saved.')
    } catch (failure) {
      setError(failure.message || 'We could not confirm the image save. Please retry.')
    } finally { setBusy(false) }
  }
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('')
    try {
      const updates = editableProfile(profile)
      updates.skills = (profile.skillsText ?? (profile.skills || []).join(',')).split(',').map(value => value.trim()).filter(Boolean)
      updates.languages = (profile.languagesText ?? (profile.languages || []).join(',')).split(',').map(value => value.trim()).filter(Boolean)
      const { error } = await withTimeout(getSupabase().from('profiles').update(updates).eq('id', userId))
      if (error) throw error
      setMessage('Profile saved.')
      if (onSaved) onSaved()
      else router.push(`/${profile.role}/profile`)
      refreshProfile()
    } catch { setError('We could not save your profile. Your changes remain here. Please retry.') }
    finally { setBusy(false) }
  }
  if (loading) return <p role="status">Loading your profile…</p>
  if (!profile) return <><p role="alert">{error}</p><button className="nx-button-secondary" onClick={() => setRevision(value => value + 1)}>Retry</button></>
  return <form className="nx-profile-form space-y-6" onSubmit={submit} aria-busy={busy}>
    <fieldset disabled={busy} className="space-y-4"><legend className="text-xl font-semibold mb-4">Profile details</legend>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{textFields.map(([name, label, required]) => <div key={name}><label htmlFor={`profile-${name}`} className="block mb-2 text-sm">{label}</label><input className="nx-field" id={`profile-${name}`} name={name} value={profile[name] || ''} maxLength={name === 'tagline' ? 200 : 100} onChange={change} required={required} /></div>)}</div>
      {['bio', 'about'].map(name => <div key={name}><label htmlFor={`profile-${name}`} className="block mb-2 text-sm">{name === 'bio' ? 'Short bio' : 'About'}</label><textarea className="nx-field" id={`profile-${name}`} name={name} value={profile[name] || ''} rows={3} maxLength={3000} onChange={change} /></div>)}
      <div><label htmlFor="profile-image" className="block mb-2 text-sm">Profile image</label><input id="profile-image" type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={upload} disabled={Boolean(pendingImage)} aria-describedby="profile-image-help" /><p id="profile-image-help" className="text-sm mt-2">JPEG, PNG, GIF, or WebP, up to 5 MiB. Profile images are publicly retrievable. The image saves immediately.</p></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{['skills', 'languages'].map(name => <div key={name}><label htmlFor={`profile-${name}`} className="block mb-2 text-sm">{name === 'skills' ? 'Skills' : 'Languages'} (comma separated)</label><input className="nx-field" id={`profile-${name}`} name={`${name}Text`} value={profile[`${name}Text`] ?? (profile[name] || []).join(', ')} maxLength={1000} onChange={change} /></div>)}</div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4"><div><label htmlFor="profile-availability" className="block mb-2 text-sm">Availability</label><select className="nx-field" id="profile-availability" name="availability_status" value={profile.availability_status || 'available'} onChange={change}><option value="available">Available</option><option value="busy">Busy</option><option value="part-time">Part-time</option></select></div><div><label htmlFor="profile-hours" className="block mb-2 text-sm">Hours per week</label><input className="nx-field" id="profile-hours" name="availability_hours_per_week" type="number" value={profile.availability_hours_per_week ?? ''} min={0} max={168} onChange={change} /></div><div><label htmlFor="profile-rate" className="block mb-2 text-sm">Hourly rate (USD)</label><input className="nx-field" id="profile-rate" name="hourly_rate" type="number" value={profile.hourly_rate ?? ''} min={0} max={100000} step="0.01" onChange={change} /></div></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[['github', 'GitHub'], ['linkedin', 'LinkedIn'], ['website', 'Portfolio website']].map(([key, label]) => <div key={key}><label htmlFor={`profile-link-${key}`} className="block mb-2 text-sm">{label}</label><input className="nx-field" id={`profile-link-${key}`} type="url" value={profile.portfolio_links?.[key] || ''} onChange={event => setProfile(previous => ({ ...previous, portfolio_links: { ...previous.portfolio_links, [key]: event.target.value } }))} maxLength={2000} /></div>)}<div><label htmlFor="profile-resume" className="block mb-2 text-sm">Resume URL (private to your profile)</label><input className="nx-field" id="profile-resume" name="resume_url" type="url" value={profile.resume_url || ''} maxLength={2000} onChange={change} /></div></div>
    </fieldset>
    {pendingImage && <button className="nx-button-secondary" type="button" disabled={busy} onClick={() => saveImage(pendingImage)}>Retry image save</button>}
    {error && <p role="alert" className="nx-feedback-error">{error}</p>}{message && <p role="status" className="nx-feedback-success">{message}</p>}
    <button className="nx-button-primary" disabled={busy || Boolean(pendingImage)}>{busy ? 'Saving…' : 'Save profile'}</button>
  </form>
}
