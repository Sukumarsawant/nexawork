import React from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, expect, test } from 'vitest'
import WorkspaceNavbar from '../app/component/WorkspaceNavbar'
import PostComposer from '../app/component/feed/PostComposer'

vi.mock('next/navigation', () => ({ usePathname: () => '/business/dashboard' }))
vi.mock('next/image', () => ({ default: ({ priority: _priority, ...props }) => <img {...props} alt={props.alt} /> }))

test('business mobile menu links to existing business routes and closes on navigation', async () => {
  const user = userEvent.setup()
  render(<WorkspaceNavbar role="business" />)
  const menuButton = screen.getByRole('button', { name: 'Open navigation' })
  await user.click(menuButton)
  expect(menuButton).toHaveAttribute('aria-expanded', 'true')
  const menu = document.getElementById('business-mobile-nav')
  expect(within(menu).getByRole('link', { name: 'Browse students' })).toHaveAttribute('href', '/business/browse-students')
  expect(within(menu).getByRole('link', { name: 'Post job' })).toHaveAttribute('href', '/business/post-job')
  expect(within(menu).getByRole('link', { name: 'Profile' })).toHaveAttribute('href', '/business/profile')
  // Avoid jsdom navigation; verify close through the same handler.
  within(menu).getByRole('link', { name: 'Home' }).addEventListener('click', event => event.preventDefault())
  await user.click(within(menu).getByRole('link', { name: 'Home' }))
  expect(document.getElementById('business-mobile-nav')).toBeNull()
  expect(menuButton).toHaveAttribute('aria-expanded', 'false')
})

test('Escape closes the business menu and returns focus to its toggle', async () => {
  const user = userEvent.setup()
  render(<WorkspaceNavbar role="business" />)
  const menuButton = screen.getByRole('button', { name: 'Open navigation' })
  await user.click(menuButton)
  await user.keyboard('{Escape}')
  expect(menuButton).toHaveFocus()
  expect(menuButton).toHaveAttribute('aria-expanded', 'false')
})

test('composer rejects unsupported images while retaining the text draft', () => {
  render(<PostComposer author={{ name: 'Synthetic Student' }} onSubmit={vi.fn()} />)
  const draft = screen.getByLabelText('What would you like to share?')
  fireEvent.change(draft, { target: { value: 'Keep this draft' } })
  const input = document.querySelector('input[type=file]')
  fireEvent.change(input, { target: { files: [new File(['synthetic'], 'example.svg', { type: 'image/svg+xml' })] } })
  expect(screen.getByRole('alert')).toHaveTextContent(/JPEG|PNG|GIF|WebP/)
  expect(draft).toHaveValue('Keep this draft')
})
