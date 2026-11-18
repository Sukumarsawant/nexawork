import React from 'react'
import { act, cleanup, fireEvent, render } from '@testing-library/react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import HeroBackground from '../app/component/HeroBackground'
import HomePage from '../app/page'

vi.mock('next/image',()=>({default:({fill:_fill,priority:_priority,...props})=><img {...props} alt={props.alt} />}))
let idle
let motion
let connection
const originalConnection = Object.getOwnPropertyDescriptor(navigator, 'connection')
beforeEach(()=>{
  idle=undefined
  motion=Object.assign(new EventTarget(),{matches:true})
  connection=Object.assign(new EventTarget(),{saveData:false,effectiveType:'4g'})
  vi.stubGlobal('matchMedia',vi.fn(()=>motion))
  vi.stubGlobal('requestIdleCallback',vi.fn(callback=>{idle=callback;return 7}))
  vi.stubGlobal('cancelIdleCallback',vi.fn())
  vi.spyOn(document,'readyState','get').mockReturnValue('complete')
  vi.spyOn(document,'visibilityState','get').mockReturnValue('visible')
  Object.defineProperty(navigator,'connection',{configurable:true,get:()=>connection})
  vi.spyOn(HTMLMediaElement.prototype,'pause').mockImplementation(()=>{})
  vi.spyOn(HTMLMediaElement.prototype,'load').mockImplementation(()=>{})
})
afterEach(()=>{cleanup();vi.useRealTimers();vi.unstubAllGlobals();vi.restoreAllMocks();if(originalConnection)Object.defineProperty(navigator,'connection',originalConnection);else delete navigator.connection})

test('landing HTML includes usable login links and no eager video source',()=>{
  const html=renderToStaticMarkup(<HomePage />)
  expect(html).toContain('Freelance and Side Hustle Ecosystem')
  expect(html.match(/href="\/login"/g)).toHaveLength(3)
  expect(html).toContain('HeroBack.webp')
  expect(html).not.toContain('HeroBack.mp4')
  expect(html).not.toContain('<video')
})

test('desktop motion starts only after the page-idle callback',()=>{
  const {container}=render(<HeroBackground />)
  expect(container.querySelector('video')).toBeNull()
  act(()=>idle())
  expect(container.querySelector('video')).toHaveAttribute('src','/HeroBack.mp4')
  expect(container.querySelector('video')).toHaveAttribute('preload','none')
})

test('narrow or reduced-motion preferences never load the video',()=>{
  motion.matches=false
  const {container}=render(<HeroBackground />)
  act(()=>idle())
  expect(container.querySelector('video')).toBeNull()
})

test('data saver and slow connections retain the poster without video',()=>{
  connection.saveData=true
  const {container}=render(<HeroBackground />)
  act(()=>idle())
  expect(container.querySelector('video')).toBeNull()
  act(()=>{connection.saveData=false;connection.effectiveType='2g';connection.dispatchEvent(new Event('change'))})
  expect(container.querySelector('video')).toBeNull()
})

test('a hidden tab unloads the video and a visible tab restores eligibility',()=>{
  const {container}=render(<HeroBackground />)
  act(()=>idle())
  const video=container.querySelector('video')
  vi.spyOn(document,'visibilityState','get').mockReturnValue('hidden')
  act(()=>document.dispatchEvent(new Event('visibilitychange')))
  expect(container.querySelector('video')).toBeNull()
  expect(video.pause).toHaveBeenCalled()
  expect(video.hasAttribute('src')).toBe(false)
  expect(video.load).toHaveBeenCalled()
  vi.spyOn(document,'visibilityState','get').mockReturnValue('visible')
  act(()=>document.dispatchEvent(new Event('visibilitychange')))
  expect(container.querySelector('video')).toHaveAttribute('src','/HeroBack.mp4')
  expect(container.querySelector('video')).not.toBe(video)
})

test('video errors preserve the poster and do not retry downloads',()=>{
  const {container}=render(<HeroBackground />)
  act(()=>idle())
  fireEvent.error(container.querySelector('video'))
  expect(container.querySelector('video')).toBeNull()
  expect(container.querySelector('img')).toHaveAttribute('src','/HeroBack.webp')
  act(()=>document.dispatchEvent(new Event('visibilitychange')))
  expect(container.querySelector('video')).toBeNull()
})

test('unmount cancels deferred media work and removes event listeners',()=>{
  const removeMotion=vi.spyOn(motion,'removeEventListener')
  const removeConnection=vi.spyOn(connection,'removeEventListener')
  const removeVisibility=vi.spyOn(document,'removeEventListener')
  const {container,unmount}=render(<HeroBackground />)
  const callback=idle
  unmount()
  expect(window.cancelIdleCallback).toHaveBeenCalledWith(7)
  act(()=>callback())
  expect(container.querySelector('video')).toBeNull()
  expect(removeMotion).toHaveBeenCalledWith('change',expect.any(Function))
  expect(removeConnection).toHaveBeenCalledWith('change',expect.any(Function))
  expect(removeVisibility).toHaveBeenCalledWith('visibilitychange',expect.any(Function))
})


test('pending page load delays scheduling until the load event',()=>{
  vi.spyOn(document,'readyState','get').mockReturnValue('loading')
  const {container}=render(<HeroBackground />)
  expect(window.requestIdleCallback).not.toHaveBeenCalled()
  expect(container.querySelector('video')).toBeNull()
  act(()=>window.dispatchEvent(new Event('load')))
  expect(window.requestIdleCallback).toHaveBeenCalledOnce()
  expect(container.querySelector('video')).toBeNull()
  act(()=>idle())
  expect(container.querySelector('video')).toHaveAttribute('src','/HeroBack.mp4')
})

test('browsers without idle callbacks defer motion with a cancellable timer',()=>{
  vi.useFakeTimers()
  vi.stubGlobal('requestIdleCallback',undefined)
  const first=render(<HeroBackground />)
  act(()=>vi.advanceTimersByTime(249))
  expect(first.container.querySelector('video')).toBeNull()
  act(()=>vi.advanceTimersByTime(1))
  expect(first.container.querySelector('video')).toHaveAttribute('src','/HeroBack.mp4')
  first.unmount()
  const schedule=vi.spyOn(window,'setTimeout')
  const pending=render(<HeroBackground />)
  const timerIndex=schedule.mock.calls.findIndex(([,delay])=>delay===250)
  expect(timerIndex).toBeGreaterThanOrEqual(0)
  const timer=schedule.mock.results[timerIndex].value
  const cancel=vi.spyOn(window,'clearTimeout')
  pending.unmount()
  expect(cancel).toHaveBeenCalledWith(timer)
  act(()=>vi.advanceTimersByTime(500))
  expect(pending.container.querySelector('video')).toBeNull()
})
