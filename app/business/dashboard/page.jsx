'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BriefcaseBusiness, CreditCard, FileText, Info, Plus, RefreshCw, Users } from 'lucide-react';
import { useAuth } from '@/component/AuthProvider';
import { getSupabase } from '@/lib/supabaseClient';
import {
  BUSINESS_DASHBOARD_LIMIT,
  fetchBusinessDashboardCount,
  fetchBusinessDashboardItems,
} from '@/lib/business-dashboard';
import './dashboard.css';

const SECTIONS = ['jobs', 'proposals', 'contracts', 'payments'];

const sectionCopy = {
  jobs: { label: 'Open jobs', heading: 'Job openings', loading: 'Loading your job openings…', empty: 'No job openings yet.', error: 'Couldn’t load your job openings.', retry: 'Retry openings', icon: BriefcaseBusiness },
  proposals: { label: 'Proposals received', heading: 'Recent proposals', loading: 'Loading your proposals…', empty: 'No proposals received yet.', error: 'Couldn’t load your proposals.', retry: 'Retry proposals', icon: FileText },
  contracts: { label: 'Active contracts', heading: 'Active contracts', loading: 'Loading your active contracts…', empty: 'No active contracts yet.', error: 'Couldn’t load your active contracts.', retry: 'Retry contracts', icon: BriefcaseBusiness },
  payments: { label: 'Payment records', heading: 'Payment records', loading: 'Loading payment records…', empty: 'No payment records yet.', error: 'Couldn’t load payment records.', retry: 'Retry payments', icon: CreditCard },
};

function part() {
  return { status: 'idle', data: null, error: null };
}

function emptyDashboard() {
  return Object.fromEntries(SECTIONS.map((section) => [section, { count: part(), items: part() }]));
}

function relatedTitle(record, relation) {
  const related = record?.[relation];
  const value = Array.isArray(related) ? related[0]?.title : related?.title;
  return typeof value === 'string' && value.trim() ? value : null;
}

function recordedDate(value) {
  if (!value || Number.isNaN(new Date(value).getTime())) return null;
  return new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(value));
}

function CountTile({ section, state, onRetry }) {
  const Icon = sectionCopy[section].icon;
  const value = state.status === 'error' ? 'Unavailable' : state.status === 'ready' ? state.data : 'Loading…';
  const stateName = state.status === 'error' ? 'error' : state.status === 'ready' ? 'ready' : 'loading';
  return <div className="nx-dashboard-stat">
    <div className="nx-dashboard-stat-label"><span>{sectionCopy[section].label}</span><Icon size={18} aria-hidden="true" /></div>
    <span className="nx-dashboard-stat-value" data-state={stateName}>{value}</span>
    {state.status === 'error' && <button className="nx-button-secondary nx-dashboard-count-retry" type="button" onClick={() => onRetry(section, 'count')}>Retry count</button>}
  </div>;
}

function RecordRow({ section, record }) {
  if (section === 'jobs') {
    return <li><div className="nx-dashboard-row-main"><Link className="nx-dashboard-job-link" href={`/jobs/${record.id}`}>{record.title || 'Job title unavailable'}</Link></div><span className="nx-dashboard-status">{record.status || 'Status unavailable'}</span></li>;
  }

  if (section === 'proposals') {
    const jobTitle = relatedTitle(record, 'jobs');
    return <li><div className="nx-dashboard-row-main">{record.job_id && jobTitle ? <Link className="nx-dashboard-job-link" href={`/jobs/${record.job_id}`}>{jobTitle}</Link> : <p className="nx-dashboard-row-title">Job unavailable</p>}</div><span className="nx-dashboard-status">{record.status || 'Status unavailable'}</span></li>;
  }

  if (section === 'contracts') {
    const dueDate = recordedDate(record.due_date);
    return <li><div className="nx-dashboard-row-main"><p className="nx-dashboard-row-title">{record.title || 'Contract title unavailable'}</p>{dueDate && <p className="nx-dashboard-row-meta">Due {dueDate}</p>}</div><span className="nx-dashboard-status">{record.status || 'Status unavailable'}</span></li>;
  }

  const contractTitle = relatedTitle(record, 'contracts');
  const paymentDate = recordedDate(record.payment_date || record.created_at);
  return <li><div className="nx-dashboard-row-main"><p className="nx-dashboard-row-title">{contractTitle || 'Contract unavailable'}</p>{paymentDate && <p className="nx-dashboard-row-meta">Recorded {paymentDate}</p>}</div><span className="nx-dashboard-status">{record.status || 'Status unavailable'}</span></li>;
}

function DashboardSection({ section, state, onRetry }) {
  const copy = sectionCopy[section];
  const Icon = copy.icon;
  const records = state.items.data || [];
  const loadingWithoutRows = state.items.status === 'loading' && !state.items.data;
  const total = state.count.status === 'ready' ? state.count.data : null;
  const latestCopy = total === null ? `Latest up to ${BUSINESS_DASHBOARD_LIMIT} records` : `Latest ${Math.min(BUSINESS_DASHBOARD_LIMIT, total)} of ${total}`;

  return <section className="nx-dashboard-section" id={section === 'jobs' ? 'openings' : section} aria-labelledby={`${section}-heading`}>
    <div className="nx-dashboard-section-heading"><div><h2 id={`${section}-heading`}>{copy.heading}</h2><p className="nx-dashboard-section-meta">{latestCopy}</p></div><Icon size={20} aria-hidden="true" /></div>
    {state.items.status === 'error' && <div className="nx-dashboard-state nx-dashboard-state-error" role="alert"><Info size={18} aria-hidden="true" /><div><p>{copy.error}</p><button className="nx-button-secondary" type="button" onClick={() => onRetry(section, 'items')}>{copy.retry}</button></div></div>}
    {loadingWithoutRows ? <p className="nx-dashboard-state" role="status">{copy.loading}</p> : records.length ? <ul className="nx-dashboard-list">{records.slice(0, BUSINESS_DASHBOARD_LIMIT).map((record) => <RecordRow key={record.id} section={section} record={record} />)}</ul> : state.items.status !== 'error' ? <p className="nx-dashboard-state">{copy.empty}</p> : null}
    {section === 'payments' && <><p className="nx-dashboard-payment-note"><Info size={16} aria-hidden="true" />Records only. Nexawork does not process payments or hold escrow.</p><p className="nx-dashboard-payment-note">Currency is not recorded for these records, so amounts are not shown.</p></>}
  </section>;
}

export default function BusinessDashboard() {
  const { user, profile, status } = useAuth();
  const [dashboard, setDashboard] = useState(emptyDashboard);
  const scope = useRef(0);
  const requests = useRef({});
  const canLoad = status === 'authenticated' && profile?.role === 'business' && Boolean(user?.id);

  const loadPart = useCallback(async (section, source, userId, currentScope) => {
    const requestKey = `${section}:${source}`;
    const requestId = (requests.current[requestKey] || 0) + 1;
    requests.current[requestKey] = requestId;
    setDashboard((current) => ({ ...current, [section]: { ...current[section], [source]: { ...current[section][source], status: 'loading', error: null } } }));

    try {
      const client = getSupabase();
      const data = source === 'count'
        ? await fetchBusinessDashboardCount(client, userId, section)
        : await fetchBusinessDashboardItems(client, userId, section);
      if (scope.current !== currentScope || requests.current[requestKey] !== requestId) return;
      setDashboard((current) => ({ ...current, [section]: { ...current[section], [source]: { status: 'ready', data, error: null } } }));
    } catch (error) {
      if (scope.current !== currentScope || requests.current[requestKey] !== requestId) return;
      setDashboard((current) => ({ ...current, [section]: { ...current[section], [source]: { ...current[section][source], status: 'error', error: error instanceof Error ? error.message : 'Unable to load this section.' } } }));
    }
  }, []);

  useEffect(() => {
    scope.current += 1;
    const currentScope = scope.current;
    setDashboard(emptyDashboard());
    if (!canLoad) return undefined;
    SECTIONS.forEach((section) => {
      void loadPart(section, 'count', user.id, currentScope);
      void loadPart(section, 'items', user.id, currentScope);
    });
    return () => { scope.current += 1; };
  }, [canLoad, loadPart, user?.id]);

  const retry = useCallback((section, source) => {
    if (!canLoad) return;
    void loadPart(section, source, user.id, scope.current);
  }, [canLoad, loadPart, user?.id]);

  const refresh = useCallback(() => {
    if (!canLoad) return;
    const currentScope = scope.current;
    SECTIONS.forEach((section) => {
      void loadPart(section, 'count', user.id, currentScope);
      void loadPart(section, 'items', user.id, currentScope);
    });
  }, [canLoad, loadPart, user?.id]);

  return <main className="nx-business-dashboard">
    <header className="nx-dashboard-heading"><h1>Business dashboard</h1><p>Review your job openings, proposals, contracts, and payment records.</p></header>
    <div className="nx-dashboard-stats" aria-label="Business dashboard summary">{SECTIONS.map((section) => <CountTile key={section} section={section} state={dashboard[section].count} onRetry={retry} />)}</div>
    <div className="nx-dashboard-actions">
      <Link className="nx-button-primary" href="/business/post-job"><Plus size={18} aria-hidden="true" />Post job</Link>
      <Link className="nx-button-secondary" href="/business/browse-students"><Users size={18} aria-hidden="true" />Browse students</Link>
      <a className="nx-button-secondary" href="#openings"><BriefcaseBusiness size={18} aria-hidden="true" />Manage openings</a>
      <a className="nx-button-secondary" href="#payments"><CreditCard size={18} aria-hidden="true" />Payment records</a>
      <button className="nx-button-secondary nx-dashboard-refresh" type="button" onClick={refresh} disabled={!canLoad}><RefreshCw size={18} aria-hidden="true" />Refresh</button>
    </div>
    <div className="nx-dashboard-collections">{SECTIONS.map((section) => <DashboardSection key={section} section={section} state={dashboard[section]} onRetry={retry} />)}</div>
  </main>;
}
