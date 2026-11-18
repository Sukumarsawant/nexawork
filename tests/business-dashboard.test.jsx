import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, test, vi } from 'vitest';
import BusinessDashboard from '@/app/business/dashboard/page';

const auth = vi.hoisted(() => ({ value: { user: { id: 'business-a' }, profile: { role: 'business' }, status: 'authenticated' } }));
const data = vi.hoisted(() => ({ count: vi.fn(), items: vi.fn() }));

vi.mock('@/app/business/dashboard/dashboard.css', () => ({}));
vi.mock('@/component/AuthProvider', () => ({ useAuth: () => auth.value }));
vi.mock('@/lib/supabaseClient', () => ({ getSupabase: () => ({}) }));
vi.mock('@/lib/business-dashboard', () => ({
  BUSINESS_DASHBOARD_LIMIT: 5,
  fetchBusinessDashboardCount: (...args) => data.count(...args),
  fetchBusinessDashboardItems: (...args) => data.items(...args),
}));
vi.mock('next/link', () => ({ default: ({ href, children, ...props }) => <a href={href} {...props}>{children}</a> }));

beforeEach(() => {
  data.count.mockReset();
  data.items.mockReset();
  data.count.mockResolvedValue(0);
  data.items.mockResolvedValue([]);
});

test('renders honest empty records and the payment limitation', async () => {
  render(<BusinessDashboard />);

  await screen.findByText('No job openings yet.');
  expect(screen.getAllByText('0')).toHaveLength(4);
  expect(screen.getByText('Records only. Nexawork does not process payments or hold escrow.')).toBeInTheDocument();
  expect(screen.getByText('Currency is not recorded for these records, so amounts are not shown.')).toBeInTheDocument();
});

test('keeps loaded proposal rows when their count read fails and retries only that count', async () => {
  const user = userEvent.setup();
  data.count.mockImplementation((_client, _userId, section) => section === 'proposals' ? Promise.reject(new Error('connection lost')) : Promise.resolve(0));
  data.items.mockImplementation((_client, _userId, section) => section === 'proposals' ? Promise.resolve([{ id: 'proposal-1', job_id: 'job-1', status: 'pending', jobs: { title: 'Long real job title' } }]) : Promise.resolve([]));
  render(<BusinessDashboard />);

  expect(await screen.findByText('Long real job title')).toBeInTheDocument();
  expect(screen.getByText('Unavailable')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Long real job title' })).toHaveAttribute('href', '/jobs/job-1');

  await user.click(screen.getByRole('button', { name: 'Retry count' }));
  await waitFor(() => expect(data.count.mock.calls.filter(([, , section]) => section === 'proposals')).toHaveLength(2));
  expect(data.items.mock.calls.filter(([, , section]) => section === 'proposals')).toHaveLength(1);
});
