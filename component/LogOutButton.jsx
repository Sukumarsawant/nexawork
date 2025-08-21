'use client'

import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      router.replace('/') // redirect to login page after logout
    } catch (err) {
      console.error('Logout error:', err.message)
    }
  }

  return (
    <button
      onClick={handleLogout}
      className="mt-4 px-6 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition"
    >
      Logout
    </button>
  )
}
