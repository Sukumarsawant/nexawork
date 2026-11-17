'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { AlertCircle, ArrowRight } from 'lucide-react'
import { getSupabase } from '@/lib/supabaseClient'
import { withTimeout } from './AuthProvider'

export default function Login() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student' })
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [expired, setExpired] = useState(false)
  const configured = Boolean(getSupabase())
  useEffect(() => { setExpired(new URLSearchParams(window.location.search).get('reason') === 'session') }, [])
  function change(event) { setForm(previous => ({ ...previous, [event.target.name]: event.target.value })) }
  async function submit(event) {
    event.preventDefault()
    setError(''); setMessage(''); setLoading(true)
    try {
      const client = getSupabase()
      if (!client) throw new Error('Set up Supabase using the README before you sign in.')
      const credentials = { email: form.email.trim(), password: form.password }
      if (isSignUp) {
        if (!form.name.trim() || !['student', 'business'].includes(form.role)) throw new Error('Enter your name and choose an account type.')
        const { data, error } = await withTimeout(client.auth.signUp({ ...credentials, options: { data: { name: form.name.trim(), role: form.role } } }))
        if (error) throw error
        if (!data.session) {
          setMessage('Check your email to confirm your account. Then return here to sign in. If the account already exists, sign in instead.')
          setForm(previous => ({ ...previous, password: '' }))
        }
      } else {
        const { error } = await withTimeout(client.auth.signInWithPassword(credentials))
        if (error) throw error
      }
    } catch (failure) { setError(failure.message || 'We could not sign you in. Please retry.') }
    finally { setLoading(false) }
  }
  return <main className="nx-login-page">
    <Link href="/" className="nx-login-brand" aria-label="Nexawork home"><Image src="/Logo.png" width={150} height={42} alt="Nexawork" priority /></Link>
    <section className="nx-account-card" aria-labelledby="login-title">
      <p className="nx-eyebrow">YOUR NEXT OPPORTUNITY STARTS HERE</p>
      <h1 id="login-title">{isSignUp ? 'Build your professional story' : 'Welcome back'}</h1>
      <p>{isSignUp ? 'Share your work, learn with peers, and find opportunities.' : 'Sign in to your Nexawork workspace.'}</p>
      {expired && !isSignUp && <div className="nx-feedback-warning" role="status"><AlertCircle size={20} aria-hidden="true" /><span>Your session ended. Sign in again to continue. Your account type stays the same.</span></div>}
      {!configured && <p className="nx-feedback-warning" role="status">This installation needs Supabase configuration. Follow the README setup instructions.</p>}
      <form onSubmit={submit} aria-busy={loading}>
        {isSignUp && <><label htmlFor="signup-name">Display name</label><input className="nx-field" id="signup-name" name="name" autoComplete="name" value={form.name} onChange={change} maxLength={100} required /></>}
        <label htmlFor="login-email">Email address</label><input className="nx-field" id="login-email" name="email" type="email" autoComplete="email" value={form.email} onChange={change} maxLength={254} placeholder="you@example.com" required />
        <label htmlFor="login-password">Password</label><input className="nx-field" id="login-password" name="password" type="password" autoComplete={isSignUp ? 'new-password' : 'current-password'} value={form.password} onChange={change} minLength={isSignUp ? 8 : 1} maxLength={128} required aria-describedby={isSignUp ? 'password-help' : undefined} />
        {isSignUp && <><small id="password-help">Use at least 8 characters.</small><label htmlFor="signup-role">Account type</label><select className="nx-field" id="signup-role" name="role" value={form.role} onChange={change}><option value="student">Student — share work and find jobs</option><option value="business">Business — discover talent and post jobs</option></select></>}
        {error && <p role="alert" className="nx-feedback-error">{error}</p>}
        {message && <p role="status" className="nx-feedback-success">{message}</p>}
        <button className="nx-button-primary nx-submit" disabled={loading || !configured}>{loading ? 'Please wait…' : isSignUp ? 'Create account' : 'Sign in'}<ArrowRight size={18} aria-hidden="true" /></button>
      </form>
      <p className="nx-auth-switch">{isSignUp ? 'Already have an account?' : 'New to Nexawork?'} <button className="nx-text-link" onClick={() => { setIsSignUp(value => !value); setError(''); setMessage('') }} disabled={loading}>{isSignUp ? 'Sign in' : 'Create an account'}</button></p>
    </section>
    <p className="nx-login-footer">A space for your work. A community for your growth.</p>
  </main>
}
