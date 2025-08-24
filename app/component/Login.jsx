'use client'

import React, { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '', role: 'student' })
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (isSignUp) {
        // Sign Up
        const { data, error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
        })

        if (error) throw error

        if (data.user) {
          // Create profile row
          const { error: profileError } = await supabase.from('profiles').insert([
            {
              id: data.user.id,
              role: form.role,
              name: form.email.split('@')[0],
            },
          ])

          if (profileError) throw profileError

          alert('Sign up successful!!🎉🎉 Please check your email to confirm.')
          setForm({ email: '', password: '', role: 'student' })
        }
      } else {
        // Sign In
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        })
        if (error) throw error
        // Redirect will be handled in LoginPage
      }
    } catch (err) {
      setError(err.message)
      console.error('Authentication error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      

      <div className="max-w-md mx-auto bg-[#3E3E55B2] mt-16 p-8 rounded-xl shadow-lg font-sans">
        <h2 className="text-3xl font-bold text-center mb-8 text-white">
          {isSignUp ? 'Create Account' : 'Welcome Back'}
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="font-semibold text-gray-700 block mb-2">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
              className="w-full px-4 py-2 bg-[#0E0E12]/70 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>

          <div className="mb-6">
            <label className="font-semibold text-gray-700 block mb-2">Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              className="w-full px-4 py-2 bg-[#0E0E12]/70 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>

          {isSignUp && (
            <div className="mb-6">
              <label className="font-semibold text-gray-700 block mb-2">Role</label>
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white"
              >
                <option value="student">Student</option>
                <option value="business">Business</option>
              </select>
            </div>
          )}

          {error && (
            <p className="text-red-500 text-sm text-center mb-4">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#5E4A77] text-white rounded-md font-bold text-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          {isSignUp ? (
            <span>
              Already have an account?{' '}
              <button
                type="button"
                className="text-blue-600 hover:underline font-semibold"
                onClick={() => {
                  setIsSignUp(false)
                  setError(null)
                }}
              >
                Sign In
              </button>
            </span>
          ) : (
            <span>
              Don&apos;t have an account?{' '}
              <button
                type="button"
                className="text-blue-600  hover:underline font-semibold"
                onClick={() => {
                  setIsSignUp(true)
                  setError(null)
                }}
              >
                Sign Up
              </button>
            </span>
          )}
        </div>
      </div>
    </>
  )
}

export default Login
