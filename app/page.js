'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Login from '@/component/Login'

export default function LoginPage() {
  const router = useRouter()

  useEffect(() => {
    // Listen for sign in events only
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single()

          if (profile?.role === 'business') {
            router.replace('/business/dashboard')
          } else {
            router.replace('/student/dashboard')
          }
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900">
      <div className="w-full max-w-md rounded bg-gray-800 p-6">
        <Login />
      </div>
    </div>
  )
}
