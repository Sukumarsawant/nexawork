'use client';

import { useState } from 'react';
import { Heart, LoaderCircle, MessageCircle } from 'lucide-react';
import FeedAvatar from './FeedAvatar';
import CommentThread from './CommentThread';

function formatTime(value) {
  if (!value) return 'Recently';
  const date = new Date(value);
  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
  return date.toLocaleDateString();
}

export default function PostCard({ post, currentAuthor, onLike, onLoadComments, onLoadMoreComments, onCreateComment }) {
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [liking, setLiking] = useState(false);
  const [likeError, setLikeError] = useState(null);
  const [imageUnavailable, setImageUnavailable] = useState(false);
  const imageUrl = post.image_url || post.image_public_url;

  const toggleLike = async () => {
    setLiking(true);
    setLikeError(null);
    const result = await onLike(post);
    setLiking(false);
    if (result?.error) setLikeError(result.error);
  };

  const toggleComments = () => {
    const shouldOpen = !commentsOpen;
    setCommentsOpen(shouldOpen);
    if (shouldOpen && !post.commentsFetched) onLoadComments(post.id);
  };

  return (
    <article className="feed-card feed-post" aria-label={`Update from ${post.author?.name || 'community member'}`}>
      <header className="feed-post__header">
        <FeedAvatar author={post.author} />
        <div className="feed-post__identity">
          <h2>{post.author?.name || 'Community member'}</h2>
          <p>
            {post.author?.username && <span>@{post.author.username} · </span>}
            <time dateTime={post.created_at}>{formatTime(post.created_at)}</time>
          </p>
        </div>
      </header>
      {post.content && <p className="feed-post__content">{post.content}</p>}
      {imageUrl && !imageUnavailable && (
        <img
          src={imageUrl}
          alt="Attachment shared with this community update"
          className="feed-post__image"
          onError={() => setImageUnavailable(true)}
        />
      )}
      {imageUrl && imageUnavailable && <p className="feed-image-unavailable" role="status">Image unavailable</p>}
      <div className="feed-post__actions">
        <button
          type="button"
          className={`feed-action ${post.viewer_has_liked ? 'feed-action--active' : ''}`}
          onClick={toggleLike}
          disabled={liking}
          aria-pressed={Boolean(post.viewer_has_liked)}
        >
          {liking ? <LoaderCircle className="feed-spinner" size={18} aria-hidden="true" /> : <Heart fill={post.viewer_has_liked ? 'currentColor' : 'none'} size={18} aria-hidden="true" />}
          {post.viewer_has_liked ? 'Liked' : 'Like'} {post.likes_count ? `(${post.likes_count})` : ''}
        </button>
        <button type="button" className="feed-action" onClick={toggleComments} aria-expanded={commentsOpen}>
          <MessageCircle size={18} aria-hidden="true" />
          Comment {post.comments_count ? `(${post.comments_count})` : ''}
        </button>
      </div>
      {likeError && <p className="feed-alert feed-alert--error" role="alert">{likeError}</p>}
      {commentsOpen && (
        <CommentThread
          comments={post.comments || []}
          author={currentAuthor}
          hasMore={Boolean(post.commentsNextCursor)}
          loading={post.commentsLoading}
          loadingMore={post.commentsLoadingMore}
          error={post.commentsError}
          onLoad={() => onLoadComments(post.id)}
          onLoadMore={() => onLoadMoreComments(post.id)}
          onSubmit={(content) => onCreateComment(post.id, content)}
        />
      )}
    </article>
  );
}
