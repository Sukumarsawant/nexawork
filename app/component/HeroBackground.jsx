'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

const MOTION_QUERY = '(min-width: 768px) and (prefers-reduced-motion: no-preference)'

export default function HeroBackground() {
  const [enabled, setEnabled] = useState(false)
  const [failed, setFailed] = useState(false)
  const videoRef = useRef(null)

  useEffect(() => {
    const video = videoRef.current
    return () => {
      if (video) { video.pause(); video.removeAttribute('src'); video.load() }
    }
  }, [enabled])

  useEffect(() => {
    if (failed || !window.matchMedia) return
    const motion = window.matchMedia(MOTION_QUERY)
    const connection = navigator.connection
    let ready = false
    let stopped = false
    let idleId
    let timer
    const update = () => {
      if (stopped) return
      const slow = ['slow-2g', '2g'].includes(connection?.effectiveType)
      setEnabled(ready && motion.matches && !connection?.saveData && !slow && document.visibilityState === 'visible')
    }
    const schedule = () => {
      const begin = () => { ready = true; update() }
      if (window.requestIdleCallback) idleId = window.requestIdleCallback(begin, { timeout: 1500 })
      else timer = window.setTimeout(begin, 250)
    }
    if (document.readyState === 'complete') schedule()
    else window.addEventListener('load', schedule, { once: true })
    motion.addEventListener('change', update)
    connection?.addEventListener?.('change', update)
    document.addEventListener('visibilitychange', update)
    return () => {
      stopped = true
      window.removeEventListener('load', schedule)
      motion.removeEventListener('change', update)
      connection?.removeEventListener?.('change', update)
      document.removeEventListener('visibilitychange', update)
      if (idleId !== undefined) window.cancelIdleCallback?.(idleId)
      if (timer !== undefined) window.clearTimeout(timer)
    }
  }, [failed])

  return <div className="absolute h-full w-[130vw] opacity-40 z-0" aria-hidden="true">
    <Image src="/HeroBack.webp" alt="" fill priority sizes="130vw" className="object-cover" />
    {enabled && !failed && <video
      ref={videoRef}
      className="absolute inset-0 h-full w-full object-cover"
      src="/HeroBack.mp4"
      poster="/HeroBack.webp"
      autoPlay loop muted playsInline preload="none"
      onError={() => { setEnabled(false); setFailed(true) }}
    />}
  </div>
}
