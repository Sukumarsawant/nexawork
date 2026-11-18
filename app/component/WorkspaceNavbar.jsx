'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { Briefcase, Home, Menu, Search, User, Users, X } from 'lucide-react'

export const workspaceRoutes = {
  student: [
    { href: '/student/dashboard', label: 'Home', icon: Home },
    { href: '/student/browse', label: 'Browse', icon: Search },
    { href: '/student/community', label: 'Community', icon: Users },
  ],
  business: [
    { href: '/business/dashboard', label: 'Home', icon: Home },
    { href: '/business/browse-students', label: 'Browse students', icon: Users },
    { href: '/business/post-job', label: 'Post job', icon: Briefcase },
  ],
}

export default function WorkspaceNavbar({ role }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const menuButton = useRef(null)
  const profileHref = `/${role}/profile`
  useEffect(() => {
    if (!open) return
    const close = event => {
      if (event.key === 'Escape') { setOpen(false); menuButton.current?.focus() }
    }
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [open])
  function item(route, mobile = false) {
    const Icon = route.icon
    return <Link key={route.href} href={route.href} onClick={() => setOpen(false)} className={`nx-nav-item${pathname === route.href ? ' nx-nav-active' : ''}${mobile ? ' nx-mobile-item' : ''}`} aria-current={pathname === route.href ? 'page' : undefined}><Icon size={18} aria-hidden="true" /><span>{route.label}</span></Link>
  }
  return <header className="nx-header">
    <nav className="nx-navigation" aria-label={`${role === 'business' ? 'Business' : 'Student'} navigation`}>
      <Link className="nx-brand" href={`/${role}/dashboard`} aria-label="Nexawork home"><Image src="/Logo.png" width={142} height={40} alt="Nexawork" priority /></Link>
      <div className="nx-desktop-nav">{workspaceRoutes[role].map(route => item(route))}</div>
      <div className="nx-nav-actions"><Link className={`nx-profile-link${pathname === profileHref ? ' nx-nav-active' : ''}`} href={profileHref} aria-label="My profile" aria-current={pathname === profileHref ? 'page' : undefined}><User size={20} aria-hidden="true" /></Link>
        {role === 'business' && <button ref={menuButton} className="nx-menu-button" aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open} aria-controls="business-mobile-nav" onClick={() => setOpen(value => !value)}>{open ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}</button>}
      </div>
      {role === 'student' && <div className="nx-student-mobile-nav">{workspaceRoutes.student.map(route => item(route, true))}</div>}
      {role === 'business' && open && <div className="nx-business-mobile-nav" id="business-mobile-nav">{workspaceRoutes.business.map(route => item(route, true))}{item({ href: profileHref, label: 'Profile', icon: User }, true)}</div>}
    </nav>
  </header>
}
