'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useRouter } from 'next/navigation';

const Login = () => {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '', role: 'student' });
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Automatically redirect if user is already logged in
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        if (!profileError && profile) {
          router.push(profile.role === 'student' ? '/student/dashboard' : '/business/dashboard');
        }
      }
    };
    checkUser();
  }, [router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
        });
        if (error) throw error;

        if (data.user) {
          const { error: profileError } = await supabase.from('profiles').insert([{
            id: data.user.id,
            role: form.role,
            name: form.email.split('@')[0],
          }]);
          if (profileError) throw profileError;

          alert('Sign up successful! Please check your email to confirm your account.');
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });
        if (error) throw error;

        if (data.user) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .single();
          if (profileError) throw profileError;

          // Debug log and redirect based on role
          console.log('Redirecting user with role:', profile.role);
          if (profile.role === 'student') {
            router.push('/student/dashboard');
          } else if (profile.role === 'business') {
            router.push('/business/dashboard');
          } else {
            setError('Unknown role: ' + profile.role);
          }
        }
      }
    } catch (err) {
      setError(err.message);
      console.error('Auth error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 p-8 bg-white rounded-xl shadow-lg font-sans">
      <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">
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
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
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
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>

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

        {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-blue-600 text-white rounded-md font-bold text-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Sign In'}
        </button>
      </form>

      <div className="mt-6 text-center">
        {isSignUp ? (
          <span>
            Already have an account?{' '}
            <button type="button" className="text-blue-600 hover:underline font-semibold" onClick={() => { setIsSignUp(false); setError(null); }}>
              Sign In
            </button>
          </span>
        ) : (
          <span>
            Don't have an account?{' '}
            <button type="button" className="text-blue-600 hover:underline font-semibold" onClick={() => { setIsSignUp(true); setError(null); }}>
              Sign Up
            </button>
          </span>
        )}
      </div>
    </div>
  );
};

export default Login;
