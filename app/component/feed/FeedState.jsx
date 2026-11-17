'use client';

import { AlertCircle, FileText, LoaderCircle } from 'lucide-react';

export default function FeedState({ type, title, detail, onRetry }) {
  const Icon = type === 'error' ? AlertCircle : type === 'loading' ? LoaderCircle : FileText;

  return (
    <section className={`feed-state feed-state--${type}`} aria-live="polite">
      <Icon className={type === 'loading' ? 'feed-state__spinner' : ''} size={24} aria-hidden="true" />
      <div>
        <h2>{title}</h2>
        {detail && <p>{detail}</p>}
        {onRetry && (
          <button type="button" className="feed-button feed-button--secondary" onClick={onRetry}>
            Try again
          </button>
        )}
      </div>
    </section>
  );
}
