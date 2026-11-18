'use client';

import { useId, useState } from 'react';
import { LoaderCircle, Send } from 'lucide-react';
import FeedAvatar from './FeedAvatar';
import FeedState from './FeedState';
import { MAX_COMMENT_LENGTH, validateCommentDraft } from '@/lib/feed-validation';

function formatTime(value) {
  if (!value) return 'Just now';
  const date = new Date(value);
  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
  return date.toLocaleDateString();
}

export default function CommentThread({ comments, author, hasMore, loading, loadingMore, error, onLoad, onLoadMore, onSubmit }) {
  const inputId = useId();
  const [content, setContent] = useState('');
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    const validationError = validateCommentDraft(content);
    if (validationError) return setSubmitError(validationError);
    setSubmitting(true);
    setSubmitError(null);
    const result = await onSubmit(content);
    setSubmitting(false);
    if (result?.error) return setSubmitError(result.error);
    setContent('');
  };

  return (
    <section className="feed-comments" aria-label="Comments">
      {loading ? (
        <FeedState type="loading" title="Loading comments" detail="Retrieving the discussion." />
      ) : error && comments.length === 0 ? (
        <FeedState type="error" title="Comments could not load" detail={error} onRetry={onLoad} />
      ) : (
        <>
          {comments.length === 0 ? (
            <p className="feed-comments__empty">No comments yet. Start the conversation.</p>
          ) : (
            <ol className="feed-comment-list">
              {comments.map((comment) => (
                <li key={comment.id} className="feed-comment">
                  <FeedAvatar author={comment.author} size="comment" />
                  <div className="feed-comment__body">
                    <div className="feed-comment__meta">
                      <strong>{comment.author?.name || 'Community member'}</strong>
                      {comment.author?.username && <span>@{comment.author.username}</span>}
                      <time dateTime={comment.created_at}>{formatTime(comment.created_at)}</time>
                    </div>
                    <p>{comment.content}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
          {error && comments.length > 0 && <p className="feed-alert feed-alert--error" role="alert">{error} <button type="button" className="feed-button feed-button--text" onClick={onLoad}>Retry comments</button></p>}
          {hasMore && (
            <button type="button" className="feed-button feed-button--text" onClick={onLoadMore} disabled={loadingMore}>
              {loadingMore ? 'Loading comments…' : 'Load more comments'}
            </button>
          )}
        </>
      )}
      <form className="feed-comment-form" onSubmit={submit} noValidate>
        <FeedAvatar author={author} size="comment" />
        <div>
          <label className="feed-sr-only" htmlFor={inputId}>Add a comment</label>
          <textarea
            id={inputId}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Add a comment"
            maxLength={MAX_COMMENT_LENGTH}
            rows={2}
            className="feed-textarea"
            disabled={submitting}
          />
          {submitError && <p className="feed-alert feed-alert--error" role="alert">{submitError}</p>}
          <button type="submit" className="feed-button feed-button--primary" disabled={!content.trim() || submitting}>
            {submitting ? <LoaderCircle className="feed-spinner" size={16} aria-hidden="true" /> : <Send size={16} aria-hidden="true" />}
            {submitting ? 'Commenting…' : 'Comment'}
          </button>
        </div>
      </form>
    </section>
  );
}
