'use client'

import { useEffect, useRef } from 'react'
import ProfileForm from '@/component/ProfileComponent'
import { useAuth } from '@/component/AuthProvider'

export default function EditProfile({ onClose }) {
  const { user } = useAuth()
  const dialog = useRef(null)
  useEffect(() => {
    const element = dialog.current
    element.showModal()
    return () => element.close()
  }, [])
  return <dialog ref={dialog} onCancel={onClose} className="nx-profile-dialog" aria-labelledby="edit-profile-title">
    <div className="nx-dialog-heading"><h2 id="edit-profile-title">Edit profile</h2><button className="nx-button-secondary" onClick={onClose} aria-label="Close profile editor">Close</button></div>
    {user && <ProfileForm userId={user.id} onSaved={onClose} />}
  </dialog>
}
