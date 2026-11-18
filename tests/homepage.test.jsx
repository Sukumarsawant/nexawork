import React from 'react'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
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
afterEach(()=>{cleanup();vi.unstubAllGlobals();vi.restoreAllMocks();if(originalConnection)Object.defineProperty(navigator,'connection',originalConnection);else delete navigator.connection})

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

test('a hidden tab pauses and unloads the video',()=>{
  const {container}=render(<HeroBackground />)
  act(()=>idle())
  const video=container.querySelector('video')
  vi.spyOn(document,'visibilityState','get').mockReturnValue('hidden')
  act(()=>document.dispatchEvent(new Event('visibilitychange')))
  expect(container.querySelector('video')).toBeNull()
  expect(video.pause).toHaveBeenCalled()
  expect(video.hasAttribute('src')).toBe(false)
  expect(video.load).toHaveBeenCalled()
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
  const {unmount}=render(<HeroBackground />)
  const callback=idle
  unmount()
  expect(window.cancelIdleCallback).toHaveBeenCalledWith(7)
  act(()=>callback())
  expect(screen.queryByRole('video')).not.toBeInTheDocument()
})
